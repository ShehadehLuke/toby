import os from "node:os";
import path from "node:path";
import { env } from "@huggingface/transformers";

export function setHuggingFaceCacheDir(): void {
	const baseDir =
		process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
	env.cacheDir = path.join(baseDir, "toby", "hf-cache");
}
