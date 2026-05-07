import { createOpenAI } from "@ai-sdk/openai";
import { Output, generateText, zodSchema } from "ai";
import { z } from "zod";
import type { UserIntentSpec } from "../ai/pretreatment";
import { readCredentials } from "../config/index";

const PLAN_GENERATION_MODEL = "gpt-4.1-mini";

const planPhaseSchema = z.object({
	label: z
		.string()
		.describe(
			"Short display label for this phase (3-6 words, e.g. 'Fetch unread emails')",
		),
	description: z
		.string()
		.describe(
			"Detailed instructions for the model to execute this phase, including what tools to use and what outcome to achieve",
		),
});

const planSchema = z.object({
	goal: z.string().describe("One-line summary of the overall goal"),
	phases: z
		.array(planPhaseSchema)
		.min(2)
		.describe(
			"Ordered list of phases to achieve the goal. Each phase should be a distinct, independently executable step.",
		),
});

const PLAN_SYSTEM = `You are a planning assistant for Toby, a CLI productivity tool. Given a user's intent specification, determine whether the request requires multiple distinct steps and produce an ordered plan.

Guidelines:
- Only produce a plan when the request genuinely requires 2+ sequential steps that depend on each other.
- Each phase should be independently describable — what the model should do, what tools it might use, and what the expected outcome is.
- Phases should be ordered by dependency: earlier phases produce outputs that later phases need.
- Keep labels short (3-6 words) and descriptions practical.
- If the request is simple enough for a single model turn, return null (the caller handles that).`;

/** Whether planning is globally disabled via env. */
export function isPlanningDisabled(): boolean {
	return process.env.TOBY_DISABLE_PLANNING === "1";
}

/**
 * Heuristic: should we attempt plan generation?
 * Runs when pretreatment's mustDo has 2+ items, or the user text matches
 * multi-clause patterns.
 */
export function shouldGeneratePlan(
	spec: UserIntentSpec | null,
	userText: string,
): boolean {
	if (isPlanningDisabled()) return false;
	if (spec && spec.mustDo.length >= 2) return true;
	const t = userText.trim().toLowerCase();
	if (
		/\band then\b|\bfirst\b.*\bthen\b|;\s*\w+|\d+\.\s+\w+.*\n.*\d+\.\s+/i.test(
			t,
		)
	) {
		return true;
	}
	return false;
}

function createPlanModel() {
	const creds = readCredentials();
	const token = creds.ai?.openai?.token;
	if (!token) {
		throw new Error(
			"OpenAI API token not configured. Run `toby configure` to set it.",
		);
	}
	const openai = createOpenAI({ apiKey: token });
	return openai(PLAN_GENERATION_MODEL);
}

type PlanGenerationResult = {
	goal: string;
	phases: readonly { label: string; description: string }[];
};

/**
 * Calls a small model to generate a plan from the user intent spec.
 * Returns null on failure/timeout or when no plan is needed.
 */
export async function generatePlan(
	spec: UserIntentSpec | null,
	userText: string,
	options?: { abortSignal?: AbortSignal; timeoutMs?: number },
): Promise<PlanGenerationResult | null> {
	if (!shouldGeneratePlan(spec, userText)) {
		return null;
	}

	const controller = new AbortController();
	const onAbort = () => controller.abort();
	if (options?.abortSignal) {
		if (options.abortSignal.aborted) return null;
		options.abortSignal.addEventListener("abort", onAbort, { once: true });
	}
	const timer = setTimeout(
		() => controller.abort(),
		options?.timeoutMs ?? 6000,
	);

	try {
		const model = createPlanModel();

		const intentSection = spec
			? `Intent specification:
- Goal: ${spec.goal}
- Must do: ${spec.mustDo.join("; ")}
- Must not: ${spec.mustNotDo.join("; ")}
- Likely integrations: ${spec.relevantIntegrations.join(", ") || "(none)"}`
			: `User request: ${userText}`;

		const result = await generateText({
			model,
			system: PLAN_SYSTEM,
			prompt: intentSection,
			output: Output.object({
				schema: zodSchema(planSchema),
				name: "Plan",
				description:
					"Ordered multi-step plan to achieve the user's goal. Return null if the request is simple enough for a single turn.",
			}),
			abortSignal: controller.signal,
			temperature: 0,
			maxOutputTokens: 1024,
		});

		const out = result.output;
		if (!out || out.phases.length < 2) {
			return null;
		}
		return {
			goal: out.goal,
			phases: out.phases.map((p) => ({
				label: p.label,
				description: p.description,
			})),
		};
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
		if (options?.abortSignal) {
			options.abortSignal.removeEventListener("abort", onAbort);
		}
	}
}
