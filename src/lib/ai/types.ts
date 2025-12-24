export interface AIProvider {
    id: 'local' | 'groq' | 'puter' | 'gemini' | 'huggingface' | 'mistral' | 'cohere';
    name: string;
    isReady: () => boolean;
    init: (progressCallback?: (data: Record<string, unknown>) => void) => Promise<void>;
    generate: (
        prompt: string,
        options?: {
            maxTokens?: number;
            temperature?: number;
            systemInstruction?: string;
        }
    ) => Promise<string>;
    release?: () => Promise<void>;
}

export type AIProviderId = AIProvider['id'];

export interface GenerationOptions {
    maxTokens?: number;
    temperature?: number;
    systemInstruction?: string;
}

