import { readConfig, writeConfig } from "../config/index";

export function getDownloadedModels(): string[] {
	return readConfig().huggingFaceModels;
}

export function addDownloadedModel(model: string): void {
	const config = readConfig();
	config.huggingFaceModels.push(model);
	writeConfig(config);
}

export function removeDownloadedModel(model: string): void {
	const config = readConfig();
	config.huggingFaceModels = config.huggingFaceModels.filter(
		(m) => m !== model,
	);
	writeConfig(config);
}
