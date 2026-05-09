import {
	getDownloadedModels,
	getInferenceModels,
} from "../huggingface/downloadedmodels";

interface AIProviderInfo {
	id: string;
	displayName: string;
	models: string[];
}

export function getAIProviders(): AIProviderInfo[] {
	return [
		{
			id: "openai",
			displayName: "OpenAI",
			models: [
				"gpt-5",
				"gpt-5-mini",
				"gpt-5-nano",
				"gpt-4o",
				"gpt-4o-mini",
				"gpt-4.1",
				"gpt-4.1-mini",
				"gpt-4.1-nano",
				"o3",
				"o4-mini",
			],
		},
		{
			id: "huggingface-self-hosted",
			displayName: "Hugging Face Self Hosted",
			models: getDownloadedModels(),
		},
		{
			id: "huggingface-inference",
			displayName: "Hugging Face Inference",
			models: getInferenceModels(),
		},
	];
}
