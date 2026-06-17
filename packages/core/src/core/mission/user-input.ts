/**
 * User-input bridge helpers.
 *
 * Persists pending questions from the orchestrator to the mission state
 * so that dashboards / plugins can surface them and the user can answer.
 */

import { join } from "node:path";
import { unlink } from "node:fs/promises";
import { atomicWriteJson, readJsonFile } from "./atomic-file.js";
import { readState } from "../artifacts.js";
import { getMissionDir } from "./scope.js";
import type { MissionScope } from "./scope.js";
import type { MissionStateFile } from "../types.js";

export interface PendingUserInput {
  question: string;
  askedAt: string;
  jobId?: string;
}

function getPendingInputPath(scope: MissionScope): string {
  return join(getMissionDir(scope), "pending-input.json");
}

/**
 * Read the mission state file (state.json) for the given mission scope.
 */
export async function readMissionState(scope: MissionScope): Promise<MissionStateFile | undefined> {
  return readState(scope);
}

/**
 * Write a pending user-input question to disk.
 */
export async function writePendingUserInput(scope: MissionScope, input: PendingUserInput): Promise<void> {
  await atomicWriteJson(getPendingInputPath(scope), input);
}

/**
 * Read any pending user-input question from disk.
 */
export async function readPendingUserInput(scope: MissionScope): Promise<PendingUserInput | undefined> {
  return readJsonFile<PendingUserInput>(getPendingInputPath(scope));
}

/**
 * Remove the pending user-input file.
 */
export async function clearPendingUserInput(scope: MissionScope): Promise<void> {
  try {
    await unlink(getPendingInputPath(scope));
  } catch {
    // File may not exist
  }
}
