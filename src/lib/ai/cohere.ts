import { AIProvider } from './types';

export class CohereProvider implements AIProvider {
    id = 'cohere' as const;
    name = 'Cohere (Free Tier)';
    private apiKey: string = "";

    constructor() {
        this.apiKey = import.meta.env.VITE_COHERE_API_KEY || localStorage.getItem("COHERE_API_KEY") || "";
    }

    isReady(): boolean {
        return !!this.apiKey;
    }

    setApiKey(key: string) {
        this.apiKey = key;
        localStorage.setItem("COHERE_API_KEY", key);
    }

    async init(): Promise<void> {
        if (!this.apiKey) {
            throw new Error("Clé API Cohere manquante.");
        }
    }

    async generate(prompt: string, options: { maxTokens?: number, temperature?: number, systemInstruction?: string } = {}): Promise<string> {
        if (!this.apiKey) {
            await this.init();
        }

        const url = "https://api.cohere.com/v1/chat";

        const body = {
            model: "command-r-plus",
            message: prompt,
            preamble: options.systemInstruction || "",
            temperature: options.temperature || 0.3,
            max_tokens: options.maxTokens || 1000
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Erreur Cohere (${response.status}): ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            return data.text || "";

        } catch (error) {
            console.error("Cohere Generation Error:", error);
            throw error instanceof Error ? error : new Error(String(error));
        }
    }
}
