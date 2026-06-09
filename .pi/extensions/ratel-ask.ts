/**
 * ratel-ask.ts — AskUser extension for Ratel
 *
 * Registers an `ask_user` tool that presents structured questionnaires
 * to the user via Pi's built-in UI primitives (select, input, confirm).
 *
 * Inspired by DroidCLI's AskUser tool:
 * - Each question gets clear presentation
 * - Select options render as buttons
 * - Free-text "Own answer" is always available (Pi provides this automatically
 *   via the trailing "(Type your own answer)" option that switches to a text
 *   input dialog)
 * - Sequential questioning with progress indication in the status bar
 */

import {
  defineTool,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "@sinclair/typebox";

const askUserParams = Type.Object({
  questions: Type.Array(
    Type.Object({
      id: Type.String({ description: "Unique identifier for this question" }),
      question: Type.String({ description: "The question text to display to the user" }),
      type: Type.Union([
        Type.Literal("select"),
        Type.Literal("multi_select"),
        Type.Literal("text"),
        Type.Literal("confirm"),
      ], { description: "Question type" }),
      options: Type.Optional(
        Type.Array(Type.String(), {
          description: "Options for select/multi_select. Required for those types.",
        }),
      ),
      placeholder: Type.Optional(
        Type.String({ description: "Placeholder text for text input" }),
      ),
      required: Type.Optional(
        Type.Boolean({ default: true, description: "Whether an answer is required" }),
      ),
    }),
    { minItems: 1, description: "Questions to ask the user" },
  ),
});

type AskUserParams = Static<typeof askUserParams>;
type Question = AskUserParams["questions"][number];

interface Answer {
  id: string;
  question: string;
  answer: string | string[] | null;
  cancelled?: boolean;
}

const FREE_TEXT_OPTION = "(Type your own answer)";
const DONE_OPTION = "Done";
const SKIP_OPTION = "";

export default function ratelAskExtension(pi: ExtensionAPI): void {
  pi.registerTool(
    defineTool({
      name: "ask_user",
      label: "Ask User",
      description:
        "Present structured questions to the user and collect answers. " +
        "Supports select (single choice), multi_select (multiple choices), " +
        "text (free input), and confirm (yes/no) question types. " +
        "Use for: requirements clarification, configuration choices, " +
        "feature scoping, or any decision that needs human input.",
      promptSnippet: "Ask the user structured questions and collect answers",
      promptGuidelines: [
        "Use ask_user when you need the user's input on a decision, choice, or requirement.",
        "Ask questions one at a time or in small groups (2-5 questions max).",
        "For select questions, always include a sensible default option if one exists.",
        "For confirm questions, frame the question so 'yes' means proceed and 'no' means stop.",
      ],
      parameters: askUserParams,

      execute: async (_toolCallId, params, signal, onUpdate, ctx) => {
        onUpdate?.({
          content: [{ type: "text", text: "Waiting for user responses..." }],
        });

        const answers: Answer[] = [];
        const questions = params.questions;
        const total = questions.length;

        for (let i = 0; i < total; i++) {
          const q = questions[i];
          ctx.ui.setStatus(
            "ratel-ask",
            `Question ${i + 1} of ${total}: ${q.question}`,
          );

          let answer: string | string[] | null = null;
          let cancelled = false;
          let skip = false;

          try {
            switch (q.type) {
              case "select": {
                const opts = [...(q.options ?? []), SKIP_OPTION, FREE_TEXT_OPTION];
                const result = await ctx.ui.select(q.question, opts, { signal });

                if (result === undefined) {
                  cancelled = true;
                } else if (result === SKIP_OPTION) {
                  skip = true;
                } else if (result === FREE_TEXT_OPTION) {
                  const custom = await ctx.ui.input(
                    q.question,
                    "Your answer",
                    { signal },
                  );
                  if (custom === undefined) {
                    cancelled = true;
                  } else {
                    answer = custom;
                  }
                } else {
                  answer = result;
                }
                break;
              }

              case "multi_select": {
                const selected: string[] = [];
                const remaining = [...(q.options ?? [])];

                while (remaining.length > 0) {
                  const header =
                    selected.length === 0 ? "none" : selected.join(", ");
                  const opts = [...remaining, SKIP_OPTION, DONE_OPTION];
                  const result = await ctx.ui.select(
                    `${q.question}\nSelected: ${header}`,
                    opts,
                    { signal },
                  );

                  if (result === undefined || result === DONE_OPTION) {
                    break;
                  }
                  if (result === SKIP_OPTION) {
                    continue;
                  }

                  selected.push(result);
                  const idx = remaining.indexOf(result);
                  if (idx >= 0) remaining.splice(idx, 1);
                }

                answer = selected.length > 0 ? selected : null;
                break;
              }

              case "text": {
                const result = await ctx.ui.input(
                  q.question,
                  q.placeholder ?? "",
                  { signal },
                );
                if (result === undefined) {
                  cancelled = true;
                } else {
                  answer = result;
                }
                break;
              }

              case "confirm": {
                const result = await ctx.ui.confirm(q.question, "", { signal });
                answer = result ? "yes" : "no";
                break;
              }
            }
          } catch {
            // Dialog dismissed (e.g. signal aborted outside the UI layer)
            cancelled = true;
          }

          if (skip) continue;

          answers.push({
            id: q.id,
            question: q.question,
            answer,
            cancelled,
          });

          // A required cancelled question halts the questionnaire early
          if (cancelled && (q.required ?? true)) {
            break;
          }
        }

        ctx.ui.setStatus("ratel-ask", undefined);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ answers }, null, 2),
            },
          ],
          details: { answers },
        };
      },
    }),
  );
}
