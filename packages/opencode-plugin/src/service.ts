/**
 * Ratel Service HTTP Client
 *
 * Thin HTTP client that talks to the Ratel core service.
 * All adapter packages use this to delegate to the service.
 */

export class RatelServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "RatelServiceError";
  }
}

export interface EnqueuedJobResponse {
  missionId: string;
  jobId: string;
  status: "queued";
}

export interface MissionStatusFeature {
  id: string;
  title: string;
  status: string;
}

export interface MissionStatusMilestone {
  id: string;
  title: string;
  status: string;
  featureIds: string[];
}

export interface MissionStatusRecentJob {
  jobId: string;
  type: string;
  status: string;
  result?: "succeeded" | "failed" | "cancelled";
  error?: { code: string; message: string; retryable: boolean };
}

export interface MissionStatusResponse {
  missionId: string;
  goal: string;
  status: string;
  phase: string;
  features: MissionStatusFeature[];
  milestones: MissionStatusMilestone[];
  planSummary: string;
  recentJobs: MissionStatusRecentJob[];
  pendingQuestion?: { question: string; askedAt: string };
  modelHealth: { healthy: boolean; models: unknown[] };
  errors: MissionStatusRecentJob[];
}

export interface MissionPlanResponse {
  missionId: string;
  goal: string;
  features: MissionStatusFeature[];
  milestones: MissionStatusMilestone[];
  validationContract?: string;
  artifacts: string[];
}

export interface MissionContinueResponse {
  missionId: string;
  jobId: string;
}

export interface MissionRetryResponse {
  missionId: string;
  jobId: string;
}

export interface MissionAnswerResponse {
  missionId: string;
  jobId: string;
}

export interface MissionJobsResponse {
  missionId: string;
  jobs: MissionJob[];
}

export interface MissionJob {
  jobId: string;
  missionId: string;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  attempt: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  cancellationRequestedAt?: string;
  error?: { code: string; message: string; retryable: boolean };
}

export interface JobStatusResponse {
  jobId: string;
  missionId: string;
  status: string;
  result?: unknown;
}

export interface ObservatoryStatusResponse {
  enabled: boolean;
  url: string | null;
}

export interface AgentPingResult {
  role: string;
  status: "ok" | "failed" | "timeout";
  timeMs: number;
  error?: string;
}

export interface PingAgentsResponse {
  ok: boolean;
  totalAgents: number;
  okCount: number;
  failedCount: number;
  totalTimeMs: number;
  agents: AgentPingResult[];
}

export class RatelServiceClient {
  constructor(private baseUrl: string) {}

  private resolve(path: string): string {
    // Health is unversioned; everything else is under /api/v1
    if (path === "/health") {
      return `${this.baseUrl}${path}`;
    }
    return `${this.baseUrl}/api/v1${path}`;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = this.resolve(path);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof RatelServiceError) throw err;
      throw new RatelServiceError(
        `Unable to connect to Ratel service at ${this.baseUrl}. Is it running? (${err instanceof Error ? err.message : String(err)})`,
        err,
      );
    }
  }

  private async get<T>(path: string): Promise<T> {
    const url = this.resolve(path);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof RatelServiceError) throw err;
      throw new RatelServiceError(
        `Unable to connect to Ratel service at ${this.baseUrl}. Is it running? (${err instanceof Error ? err.message : String(err)})`,
        err,
      );
    }
  }

  async health(): Promise<{ status: string }> {
    return this.get("/health");
  }

  async startMission(goal: string): Promise<EnqueuedJobResponse> {
    return this.post("/missions", { goal });
  }

  async getMissionStatus(missionId: string): Promise<MissionStatusResponse> {
    return this.get(`/missions/${encodeURIComponent(missionId)}/status`);
  }

  /** Backward-compatible legacy status lookup (returns raw mission record). */
  async getMissionRecord(missionId: string): Promise<{ missionId: string; state: unknown }> {
    return this.get(`/missions/${encodeURIComponent(missionId)}`);
  }

  async getPlan(missionId: string): Promise<MissionPlanResponse> {
    return this.get(`/missions/${encodeURIComponent(missionId)}/plan`);
  }

  async listJobs(missionId: string): Promise<MissionJobsResponse> {
    return this.get(`/missions/${encodeURIComponent(missionId)}/jobs`);
  }

  async getJob(missionId: string, jobId: string): Promise<MissionJob> {
    return this.get(`/missions/${encodeURIComponent(missionId)}/jobs/${encodeURIComponent(jobId)}`);
  }

  async getJobStatus(missionId: string, jobId: string): Promise<JobStatusResponse> {
    return this.get(`/missions/${encodeURIComponent(missionId)}/jobs/${encodeURIComponent(jobId)}`);
  }

  async continueMission(missionId: string): Promise<MissionContinueResponse> {
    return this.post(`/missions/${encodeURIComponent(missionId)}/continue`, {});
  }

  async retryMission(missionId: string): Promise<MissionRetryResponse> {
    return this.post(`/missions/${encodeURIComponent(missionId)}/retry`, {});
  }

  async answerMissionInput(missionId: string, answer: string): Promise<MissionAnswerResponse> {
    return this.post(`/missions/${encodeURIComponent(missionId)}/answer`, { answer });
  }

  async cancelJob(missionId: string, jobId: string): Promise<{ jobId: string; status: string }> {
    return this.post(`/missions/${encodeURIComponent(missionId)}/jobs/${encodeURIComponent(jobId)}/cancel`, {});
  }

  async approveMission(missionId: string): Promise<EnqueuedJobResponse> {
    return this.post(`/missions/${encodeURIComponent(missionId)}/approval`, { approved: true });
  }

  async runWorker(missionId: string, featureId: string): Promise<EnqueuedJobResponse> {
    return this.post(`/missions/${encodeURIComponent(missionId)}/workers`, { featureId });
  }

  async runValidation(missionId: string, milestoneId: string): Promise<EnqueuedJobResponse> {
    return this.post(`/missions/${encodeURIComponent(missionId)}/validations`, { milestoneId });
  }

  async getObservatoryUrl(): Promise<ObservatoryStatusResponse> {
    return this.get("/observatory/status");
  }

  async pingAgents(): Promise<PingAgentsResponse> {
    return this.post("/ping/agents", {});
  }

  getMissionEventsUrl(missionId: string): string {
    return `${this.baseUrl}/api/v1/missions/${encodeURIComponent(missionId)}/events`;
  }
}
