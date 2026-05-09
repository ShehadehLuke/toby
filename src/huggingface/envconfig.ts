import { homedir } from "node:os";
import path from "node:path";
import { env } from "@huggingface/transformers";

export function setHuggingFaceCacheDir(): void {
	env.cacheDir = path.join(homedir(), ".cache", "huggingface");
}
