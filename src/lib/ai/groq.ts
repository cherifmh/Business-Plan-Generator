import { AIProvider } from './types';

export class GroqProvider implements AIProvider {
    id = 'groq' as const;
    name = 'Groq (Expert Rapide)';
    private apiKey: string = "";
    private selectedModel: string = "auto";
    private availableModels: string[] = ["auto", "llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "groq/compound", "llama-3.1-8b-instant"];

    constructor() {
        this.apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("GROQ_API_KEY") || "";
        const savedModel = localStorage.getItem("GROQ_MODEL");
        if (savedModel && this.availableModels.includes(savedModel)) {
            this.selectedModel = savedModel;
        } else {
            this.selectedModel = "auto";
            localStorage.setItem("GROQ_MODEL", "auto");
        }
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
        // Prioritize only proven, reliable chat models
        const priorityList = [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "groq/compound",
            "mixtral-8x22b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
            "llama-3.1-8b-instant"
        ];

        // 1. Check exact matches first
        for (const model of priorityList) {
            if (models.includes(model)) return model;
        }

        // 2. Fallback to first available model (but skip non-chat models)
        for (const model of models) {
            if (model !== "auto" && !model.includes("whisper")) {
                return model;
            }
        }
        
        return "llama-3.3-70b-versatile";
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
            console.log(`[Groq] Sending request to model: ${modelToUse}`);
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
                console.error(`[Groq] Error response from ${modelToUse}:`, errorData);
                
                const retries = options.retries !== undefined ? options.retries : 3;
                // If model is not working and we're in auto mode, try another
                if (this.selectedModel === "auto" && retries > 0) {
                    console.warn(`[Groq] Model ${modelToUse} failed, trying another model...`);
                    this.availableModels = this.availableModels.filter(m => m !== modelToUse);
                    return this.generate(prompt, { ...options, retries: retries - 1 });
                }

                throw new Error(`Erreur Groq (${response.status}): ${errMsg}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || "";
            console.log(`[Groq] Received response from ${modelToUse} (length: ${content.length})`);
            
            // If we got an empty response and in auto mode, try another model
            if (content.trim() === "" && this.selectedModel === "auto" && (options.retries ?? 3) > 0) {
                console.warn(`[Groq] Empty response from ${modelToUse}, trying another model...`);
                this.availableModels = this.availableModels.filter(m => m !== modelToUse);
                return this.generate(prompt, { ...options, retries: (options.retries ?? 3) - 1 });
            }
            
            return content;

        } catch (error) {
            console.error("[Groq] Generation Error:", error);
            throw error;
        }
    }
}
