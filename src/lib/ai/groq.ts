import { AIProvider } from './types';

export class GroqProvider implements AIProvider {
    id = 'groq' as const;
    name = 'Groq (Expert Rapide)';
    private apiKey: string = "";
    private defaultKey = "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";
    private selectedModel: string = "llama-3.1-8b-instant";
    private availableModels: string[] = ["llama-3.1-8b-instant", "llama-3.1-70b-versatile", "llama-3.2-11b-vision-preview", "llama-3.2-3b-preview"];

    constructor() {
        this.apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("GROQ_API_KEY") || this.defaultKey;
        const savedModel = localStorage.getItem("GROQ_MODEL");
        if (savedModel) this.selectedModel = savedModel;
    }

    isReady(): boolean {
        return !!this.apiKey;
    }

    setApiKey(key: string) {
        this.apiKey = key;
        localStorage.setItem("GROQ_API_KEY", key);
    }

    setModel(model: string) {
        this.selectedModel = model;
        localStorage.setItem("GROQ_MODEL", model);
    }

    getSelectedModel() {
        return this.selectedModel;
    }

    async init(): Promise<void> {
        if (!this.apiKey) {
            throw new Error("Clé API Groq manquante.");
        }
        // Tentative de mise à jour de la liste des modèles
        this.fetchModels().catch(console.error);
    }

    async fetchModels(): Promise<string[]> {
        if (!this.apiKey) return this.availableModels;
        try {
            const response = await fetch("https://api.groq.com/openai/v1/models", {
                headers: { "Authorization": `Bearer ${this.apiKey}` }
            });
            if (response.ok) {
                const data = await response.json();
                this.availableModels = (data.data as Array<{ id: string }>).map((m) => m.id);
                return this.availableModels;
            }
        } catch (e) {
            console.error("Failed to fetch Groq models", e);
        }
        return this.availableModels;
    }

    async generate(prompt: string, options: { maxTokens?: number, temperature?: number, systemInstruction?: string } = {}): Promise<string> {
        if (!this.apiKey) {
            await this.init();
        }

        const url = "https://api.groq.com/openai/v1/chat/completions";

        const messages = [];
        if (options.systemInstruction) {
            messages.push({ role: "system", content: options.systemInstruction });
        }
        messages.push({ role: "user", content: prompt });

        const body = {
            model: this.selectedModel,
            messages: messages,
            temperature: options.temperature || 0.7,
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
                throw new Error(`Erreur Groq (${response.status}): ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";

        } catch (error) {
            console.error("Groq Generation Error:", error);
            throw error;
        }
    }
}
