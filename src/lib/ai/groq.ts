import { AIProvider } from './types';

export class GroqProvider implements AIProvider {
    id = 'groq' as const;
    name = 'Groq (Expert Rapide)';
    private apiKey: string = "";
    private selectedModel: string = "auto";
    private availableModels: string[] = ["auto", "llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "allam-2-7b", "groq/compound", "qwen/qwen3.6-27b", "whisper-large-v3"];

    constructor() {
        this.apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("GROQ_API_KEY") || "";
        const savedModel = localStorage.getItem("GROQ_MODEL");
        if (savedModel) this.selectedModel = savedModel;
    }

    isReady(): boolean {
        return !!this.apiKey;
    }

    setApiKey(key: string) {
        this.apiKey = key.trim();
        if (this.apiKey) localStorage.setItem("GROQ_API_KEY", this.apiKey);
        else localStorage.removeItem("GROQ_API_KEY");
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
    }

    async getBestAvailableModel(): Promise<string> {
        const models = await this.fetchModels();
        const priorityList = [
            "openai/gpt-oss-120b",
            "qwen/qwen3.6-27b",
            "groq/compound",
            "llama-3.3-70b-versatile",
            "openai/gpt-oss-20b",
            "llama-3.1-70b-versatile",
            "allam-2-7b",
            "llama-3.1-8b-instant"
        ];

        // 1. Check exact matches first
        for (const model of priorityList) {
            if (models.includes(model)) return model;
        }

        // 2. Fallback to first available model
        return models.length > 0 ? models[0] : "llama-3.3-70b-versatile";
    }

    async generate(prompt: string, options: { maxTokens?: number, temperature?: number, systemInstruction?: string, retries?: number } = {}): Promise<string> {
        if (!this.apiKey) {
            await this.init();
        }

        const url = "https://api.groq.com/openai/v1/chat/completions";

        const messages = [];
        if (options.systemInstruction) {
            messages.push({ role: "system", content: options.systemInstruction });
        }
        messages.push({ role: "user", content: prompt });

        let modelToUse = this.selectedModel;
        if (modelToUse === "auto") {
            modelToUse = await this.getBestAvailableModel();
            console.log(`[Groq] Auto-selected best model: ${modelToUse}`);
        }

        const body = {
            model: modelToUse,
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
                const errMsg = errorData.error?.message || response.statusText;
                
                const retries = options.retries !== undefined ? options.retries : 3;
                if (response.status === 400 && errMsg.toLowerCase().includes("decommissioned") && this.selectedModel === "auto" && retries > 0) {
                    console.warn(`[Groq] Model ${modelToUse} is decommissioned. Removing and retrying...`);
                    this.availableModels = this.availableModels.filter(m => m !== modelToUse);
                    return this.generate(prompt, { ...options, retries: retries - 1 });
                }

                throw new Error(`Erreur Groq (${response.status}): ${errMsg}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";

        } catch (error) {
            console.error("Groq Generation Error:", error);
            throw error;
        }
    }
}
