import { ModelRegistry } from "@huggingface/transformers";
import chalk from "chalk";
import { readConfig, writeConfig } from "../config/index";

export function getDownloadedModels(): string[] {
	return readConfig().huggingFaceModels;
}

export function addDownloadedModel(model: string): void {
	const config = readConfig();
	config.huggingFaceModels.push(model);
	writeConfig(config);
}

export async function removeDownloadedModel(model: string): Promise<void> {
	try {
		const result = await ModelRegistry.clear_cache(model);
	} catch (error) {
		console.error(chalk.red(error));
		process.exitCode = 1;
		return;
	}
	const config = readConfig();
	config.huggingFaceModels = config.huggingFaceModels.filter(
		(m) => m !== model,
	);
	writeConfig(config);
}
