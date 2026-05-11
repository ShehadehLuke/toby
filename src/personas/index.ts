import { type Persona, readConfig } from "../config/index";

export const DEFAULT_CHAT_PERSONA: Persona = {
	name: "default-chat",
	instructions: "",
	promptMode: "add",
	ai: {
		provider: "openai",
		model: "gpt-5-mini",
	},
};

export function resolvePersona(name: string): Persona | undefined {
	const config = readConfig();
	return (
		config.personas.find((p) => p.name === name) ??
		(name === DEFAULT_CHAT_PERSONA.name ? DEFAULT_CHAT_PERSONA : undefined)
	);
}

export function listPersonas(): Persona[] {
	const personas = readConfig().personas;
	if (personas.some((p) => p.name === DEFAULT_CHAT_PERSONA.name)) {
		return personas;
	}
	return [DEFAULT_CHAT_PERSONA, ...personas];
}
