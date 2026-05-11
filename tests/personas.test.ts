import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	DEFAULT_CHAT_PERSONA,
	listPersonas,
	resolvePersona,
} from "../src/personas/index";

let tempDir: string;
let previousTobyDir: string | undefined;

beforeEach(() => {
	tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "toby-personas-"));
	previousTobyDir = process.env.TOBY_DIR;
	process.env.TOBY_DIR = tempDir;
});

afterEach(() => {
	if (previousTobyDir === undefined) {
		process.env.TOBY_DIR = undefined;
	} else {
		process.env.TOBY_DIR = previousTobyDir;
	}
	fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("personas", () => {
	it("resolves the built-in default chat persona", () => {
		expect(resolvePersona("default-chat")).toEqual(DEFAULT_CHAT_PERSONA);
	});

	it("includes the built-in default chat persona in the persona list", () => {
		expect(listPersonas()).toEqual([DEFAULT_CHAT_PERSONA]);
	});

	it("lets config override the built-in default chat persona", () => {
		const override = {
			name: "default-chat",
			instructions: "Use my local defaults.",
			promptMode: "replace" as const,
			ai: { provider: "openai", model: "gpt-5.1" },
		};
		fs.writeFileSync(
			path.join(tempDir, "config.json"),
			JSON.stringify({ integrations: {}, personas: [override] }),
		);

		expect(resolvePersona("default-chat")).toEqual(override);
		expect(listPersonas()).toEqual([override]);
	});
});
