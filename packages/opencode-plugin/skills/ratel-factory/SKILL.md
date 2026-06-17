---
name: ratel-factory
description: Operate the Ratel AI Software Factory from a host coding agent such as OpenCode or Pi. Use when the user asks to run Ratel, start a factory mission, delegate a long-running end-to-end software build, monitor a Ratel mission, open the Observatory, or continue/cancel factory work.
---

# Ratel Factory

You are the OpenCode adapter for the Ratel AI Software Factory. All durable state lives in the Ratel service. Do not create git worktrees, feature branches, or mission artifacts manually.

## When to use

- The user asks you to "build", "implement", "create", "add", or "delegate" something using Ratel.
- The user asks about mission status, progress, plans, jobs, errors, or the Observatory.

## Unified adapter flow

1. **Start the mission**
   - Call `ratel_start_mission` with the user's exact request as the `goal`.
   - Do not ask intake questions yourself. Ratel will handle discovery.
   - Cache the returned `missionId` and `jobId`.

2. **Poll status**
   - Call `ratel_get_status` with the cached `missionId`.
   - Summarize the result concisely for the user.

3. **Handle pending questions**
   - If `ratel_get_status` returns `pendingQuestion`, copy the exact question into the OpenCode chat and ask the user.
   - After the user replies, call `ratel_answer_question` with the `missionId` and the user's answer.
   - Return to step 2.

4. **Handle approval gate**
   - If the status is `waiting_for_approval`, tell the user to approve or reject in the Observatory dashboard, or call `ratel_continue_mission` to proceed.

5. **Handle errors or stalls**
   - If the status shows errors or a stuck phase, call `ratel_retry_phase` to retry.

6. **Inspect plan and jobs**
   - Use `ratel_get_plan` to show the user the planned features, milestones, validation contract, and artifacts.
   - Use `ratel_list_jobs` to show what jobs have run and their statuses.
   - Use `ratel_get_job_result` for details on a specific job.

## Tools

- `ratel_start_mission` — Start a mission. Requires auth bridge (runs automatically).
- `ratel_get_status` — Rich read-only status.
- `ratel_get_plan` — Read-only plan and artifacts.
- `ratel_list_jobs` — Read-only job list.
- `ratel_get_job_result` — Read-only job details.
- `ratel_answer_question` — Answer a pending question. Requires auth bridge.
- `ratel_continue_mission` — Continue past approval/stall. Requires auth bridge.
- `ratel_retry_phase` — Retry a failed/stalled phase. Requires auth bridge.

## State rule

Never edit files under `.ratel/missions/<missionId>/` directly. Always go through the Ratel service tools.

## Fallback

If the Ratel service is unreachable, tell the user:

> The Ratel service is not running. Start it with:
> ```
> ratel --serve --port 8765
> ```
> Then retry your request.
