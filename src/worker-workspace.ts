import { execFile as execFileCb } from "node:child_process";
import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { resolveCanonicalWorkspace } from "./workspace-resolution.js";

const execFile = promisify(execFileCb);

export type WorkerWorkspaceStatus = "ready" | "skipped" | "blocked" | "merged" | "no_changes";

export interface WorkerWorkspaceResult {
  status: WorkerWorkspaceStatus;
  repoPath?: string;
  integrationBranch: string;
  featureBranch?: string;
  integrationHead?: string;
  featureTip?: string;
  mergeCommit?: string;
  reason?: string;
}

async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFile("git", args, { cwd });
  return stdout.trim();
}

async function gitOk(cwd: string, args: string[]): Promise<boolean> {
  try {
    await git(cwd, args);
    return true;
  } catch {
    return false;
  }
}

async function isGitRepoOnBranch(dir: string, branch: string): Promise<boolean> {
  try {
    await git(dir, ["rev-parse", "--git-dir"]);
    return await git(dir, ["branch", "--show-current"]) === branch;
  } catch {
    return false;
  }
}

async function findRepoOnBranch(cwd: string, branch: string): Promise<string | undefined> {
  if (await isGitRepoOnBranch(cwd, branch)) return cwd;

  let entries: Dirent[];
  try {
    entries = await readdir(cwd, { withFileTypes: true });
  } catch {
    return undefined;
  }

  const ignored = new Set(["node_modules", "dist", ".missions", ".pi", ".agents", ".claude"]);
  for (const entry of entries) {
    if (!entry.isDirectory() || ignored.has(entry.name)) continue;
    const candidate = join(cwd, entry.name);
    if (await isGitRepoOnBranch(candidate, branch)) return candidate;
  }
  return undefined;
}

function featureBranchName(featureId: string): string {
  return `feat/${featureId.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
}

async function workingTreeStatus(repoPath: string): Promise<string> {
  return git(repoPath, ["status", "--porcelain"]);
}

async function ensureClean(repoPath: string): Promise<string | undefined> {
  const status = await workingTreeStatus(repoPath);
  return status.length > 0 ? status : undefined;
}

async function branchExists(repoPath: string, branch: string): Promise<boolean> {
  return gitOk(repoPath, ["rev-parse", "--verify", branch]);
}

async function revParse(repoPath: string, ref: string): Promise<string> {
  return git(repoPath, ["rev-parse", ref]);
}

async function aheadCount(repoPath: string, base: string, branch: string): Promise<number> {
  const out = await git(repoPath, ["rev-list", "--count", `${base}..${branch}`]);
  return Number.parseInt(out, 10) || 0;
}

export async function prepareSerialWorkerBranch(
  cwd: string,
  featureId: string,
  integrationBranch = "integration",
): Promise<WorkerWorkspaceResult> {
  const repoPath = await resolveCanonicalWorkspace(cwd, integrationBranch);
  const featureBranch = featureBranchName(featureId);

  if (!repoPath) {
    return {
      status: "skipped",
      integrationBranch,
      featureBranch,
      reason: `No git repository with branch ${integrationBranch} was found under ${cwd}.`,
    };
  }

  const dirty = await ensureClean(repoPath);
  if (dirty) {
    return {
      status: "blocked",
      repoPath,
      integrationBranch,
      featureBranch,
      reason: `Cannot start worker branch from a dirty repository. Clean or commit these changes first:\n${dirty}`,
    };
  }

  await git(repoPath, ["checkout", integrationBranch]);
  const integrationHead = await revParse(repoPath, integrationBranch);

  if (await branchExists(repoPath, featureBranch)) {
    const ahead = await aheadCount(repoPath, integrationBranch, featureBranch);
    if (ahead > 0) {
      return {
        status: "blocked",
        repoPath,
        integrationBranch,
        featureBranch,
        integrationHead,
        reason: `${featureBranch} already has ${ahead} commit(s) not merged into ${integrationBranch}. Refusing to reset or overwrite existing work.`,
      };
    }
    await git(repoPath, ["branch", "-f", featureBranch, integrationBranch]);
    await git(repoPath, ["checkout", featureBranch]);
  } else {
    await git(repoPath, ["checkout", "-b", featureBranch, integrationBranch]);
  }

  return {
    status: "ready",
    repoPath,
    integrationBranch,
    featureBranch,
    integrationHead,
  };
}

export async function finalizeSerialWorkerBranch(
  cwd: string,
  featureId: string,
  integrationBranch = "integration",
  /** If provided, use this exact repo path instead of re-discovering. Prevents sibling-directory misselection. */
  knownRepoPath?: string,
): Promise<WorkerWorkspaceResult> {
  const featureBranch = featureBranchName(featureId);
  const repoPath = knownRepoPath
    ?? await findRepoOnBranch(cwd, featureBranch)
    ?? await resolveCanonicalWorkspace(cwd, integrationBranch);

  if (!repoPath) {
    return {
      status: "skipped",
      integrationBranch,
      featureBranch,
      reason: `No git repository with branch ${integrationBranch} was found under ${cwd}.`,
    };
  }

  const dirty = await ensureClean(repoPath);
  if (dirty) {
    return {
      status: "blocked",
      repoPath,
      integrationBranch,
      featureBranch,
      reason: `Cannot finalize worker branch from a dirty repository. Resolve or commit these changes first:\n${dirty}`,
    };
  }

  if (!(await branchExists(repoPath, featureBranch))) {
    return {
      status: "blocked",
      repoPath,
      integrationBranch,
      featureBranch,
      reason: `${featureBranch} does not exist.`,
    };
  }

  const ahead = await aheadCount(repoPath, integrationBranch, featureBranch);
  const featureTip = await revParse(repoPath, featureBranch);
  if (ahead === 0) {
    await git(repoPath, ["checkout", integrationBranch]);
    return {
      status: "no_changes",
      repoPath,
      integrationBranch,
      featureBranch,
      featureTip,
      integrationHead: await revParse(repoPath, integrationBranch),
      reason: `${featureBranch} has no commits ahead of ${integrationBranch}.`,
    };
  }

  await git(repoPath, ["checkout", integrationBranch]);
  try {
    await git(repoPath, ["merge", "--no-ff", featureBranch, "-m", `merge(${featureId}): integrate worker branch`]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "blocked",
      repoPath,
      integrationBranch,
      featureBranch,
      featureTip,
      reason: `Merge conflict or merge failure while integrating ${featureBranch}: ${message}`,
    };
  }

  return {
    status: "merged",
    repoPath,
    integrationBranch,
    featureBranch,
    featureTip,
    integrationHead: await revParse(repoPath, integrationBranch),
    mergeCommit: await revParse(repoPath, "HEAD"),
  };
}
