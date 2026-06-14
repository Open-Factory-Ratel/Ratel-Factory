import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createMissionScope, getMissionDir } from "../core/mission/scope.js";
import { EventLogger } from "../core/observability/event-logger.js";
import { ensureMissionInitialized } from "../core/artifacts.js";
import { OrchestratorAgent } from "../core/orchestrator.js";
import type { MissionJob } from "./types.js";
import type { JobStore } from "./job-store.js";
import { BudgetManager } from "../core/budget/budget-manager.js";
import { getBudgetConfig } from "../core/config.js";
import { BudgetExceededError } from "../core/budget/types.js";
import { observeAgentSession } from "../core/observability/session-events.js";

export interface JobExecutor {
  execute(job: MissionJob, signal: AbortSignal): Promise<void>;
}

export interface JobRunnerOptions {
  cwd: string;
  jobStore?: JobStore;
}

export class JobRunner implements JobExecutor {
  constructor(private options: JobRunnerOptions) {}

  async execute(job: MissionJob, signal: AbortSignal): Promise<void> {
    const scope = createMissionScope(this.options.cwd, job.missionId);
    const logger = await EventLogger.forMission(scope);
    await ensureMissionInitialized(scope, logger);

    // Resolve and initialize budget limits
    const budgetLimits = await getBudgetConfig(this.options.cwd, job.payload.budget as import("../core/config.js").MissionBudgetConfig | undefined);
    const budget = new BudgetManager(scope);
    await budget.initialize(budgetLimits);

    const jobControl = this.options.jobStore
      ? {
          markWaitingForApproval: async () => {
            await this.options.jobStore!.markWaitingForApproval(job.missionId, job.jobId);
          },
        }
      : undefined;

    const context = { scope, logger, budget, jobControl };

    const agent = new OrchestratorAgent();
    await agent.init({
      cwd: this.options.cwd,
      missionId: job.missionId,
      inMemory: true,
      jobControl,
      budget,
    });

    // Observe agent session for budget usage tracking
    const session = agent.getSession();
    const unsubscribe = observeAgentSession(session, {
      logger,
      agentLevel: "orchestrator",
      parentSpanId: logger.getTraceId(),
      budgetManager: budget,
    });

    try {
      if (signal.aborted) {
        throw new Error("Job aborted");
      }

      // Budget gate: assert can start before prompt
      await budget.assertCanStart("orchestrator");
      await budget.recordAgentStart("orchestrator");
      const wallClockSignal = budget.createWallClockAbortSignal(signal);

      const prompt = this.buildPrompt(job);
      await agent.prompt(prompt);
    } catch (err) {
      if (err instanceof BudgetExceededError) {
        await this.handleBudgetExceeded(scope, logger, budget, job, err);
      }
      throw err;
    } finally {
      unsubscribe();
      agent.dispose();
      await logger.shutdown();
    }
  }

  private async handleBudgetExceeded(
    scope: import("../core/mission/scope.js").MissionScope,
    logger: EventLogger,
    budget: BudgetManager,
    job: MissionJob,
    error: BudgetExceededError,
  ): Promise<void> {
    // Emit budget exceeded event
    logger.budgetExceeded({
      missionId: scope.missionId,
      reason: error.metric,
      limit: error.limit,
      actual: error.actual,
    });

    // Write halt reason
    const haltPath = join(getMissionDir(scope), "halt-reason.md");
    await writeFile(
      haltPath,
      `# Halted: Budget Exceeded\n\nMetric: ${error.metric}\nLimit: ${error.limit}\nActual: ${error.actual}\nMission: ${scope.missionId}\n`,
      "utf-8",
    );

    // Mark job failed with budget_exceeded code
    if (this.options.jobStore) {
      await this.options.jobStore.markFailed(job.missionId, job.jobId, {
        code: "budget_exceeded",
        message: `Budget exceeded: ${error.metric} (${error.actual} > ${error.limit})`,
        retryable: false,
      });
    }
  }

  private buildPrompt(job: MissionJob): string {
    const payload = job.payload;
    switch (job.type) {
      case "start_mission":
        return String(payload.goal ?? "");
      case "continue_orchestrator":
        return String(payload.message ?? "");
      case "run_worker":
        return `Run worker for feature ${payload.featureId}`;
      case "run_validation":
        return `Run scrutiny validation for milestone ${payload.milestoneId}`;
      case "run_user_testing":
        return `Run user testing for milestone ${payload.milestoneId}`;
      default:
        return "";
    }
  }
}
