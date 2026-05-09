import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@huggingface/transformers", () => ({
	ModelRegistry: {
		clear_cache: vi.fn(async () => undefined),
	},
}));

import { ModelRegistry } from "@huggingface/transformers";
import {
	addDownloadedModel,
	addInferenceModel,
	getDownloadedModels,
	getInferenceModels,
	removeDownloadedModel,
	removeInferenceModel,
} from "../src/huggingface/downloadedmodels";

describe("downloadedmodels", () => {
	let previousTobyDir: string | undefined;
	let tempTobyDir = "";

	beforeEach(() => {
		previousTobyDir = process.env.TOBY_DIR;
		tempTobyDir = fs.mkdtempSync(path.join(os.tmpdir(), "toby-models-test-"));
		process.env.TOBY_DIR = tempTobyDir;
		process.exitCode = 0;
	});

	afterEach(() => {
		if (previousTobyDir === undefined) {
			process.env.TOBY_DIR = undefined;
		} else {
			process.env.TOBY_DIR = previousTobyDir;
		}
		fs.rmSync(tempTobyDir, { recursive: true, force: true });
		vi.clearAllMocks();
	});

	it("adds and reads downloaded model ids from config", () => {
		expect(getDownloadedModels()).toEqual([]);

		addDownloadedModel("Qwen/Qwen3-0.6B");

		expect(getDownloadedModels()).toEqual(["Qwen/Qwen3-0.6B"]);
	});

	it("removes a downloaded model and clears its cache", async () => {
		addDownloadedModel("Qwen/Qwen3-0.6B");
		addDownloadedModel("ibm-granite/granite-3.3-2b-instruct");

		await removeDownloadedModel("Qwen/Qwen3-0.6B");

		expect(ModelRegistry.clear_cache).toHaveBeenCalledWith("Qwen/Qwen3-0.6B");
		expect(getDownloadedModels()).toEqual([
			"ibm-granite/granite-3.3-2b-instruct",
		]);
		expect(process.exitCode).toBe(0);
	});

	it("adds, lists, and removes inference model ids from config", () => {
		expect(getInferenceModels()).toEqual([]);

		addInferenceModel("meta-llama/Llama-3.2-3B-Instruct");
		expect(getInferenceModels()).toEqual(["meta-llama/Llama-3.2-3B-Instruct"]);

		removeInferenceModel("meta-llama/Llama-3.2-3B-Instruct");
		expect(getInferenceModels()).toEqual([]);
	});
});
