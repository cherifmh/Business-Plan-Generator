import { AIProvider } from './types';
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

export class GeminiProvider implements AIProvider {
    id = 'gemini' as const;
    name = 'Google Gemini';
    private apiKey: string = "";
    // Default hardcoded key as requested
    private defaultKey = "AIzaSyCRM2HxU7B-VwY9zyzx1EwtYnYA5BMJNDo";
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;

    constructor() {
        this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("GEMINI_API_KEY") || this.defaultKey;
    }

    isReady(): boolean {
        return !!this.apiKey;
    }

    setApiKey(key: string) {
        this.apiKey = key;
        localStorage.setItem("GEMINI_API_KEY", key);
        this.genAI = null; // Reset instance
    }

    async init(): Promise<void> {
        if (!this.apiKey) {
            // Fallback to default if somehow empty
            this.apiKey = this.defaultKey;
        }
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async generate(prompt: string, options: { maxTokens?: number, temperature?: number, systemInstruction?: string } = {}): Promise<string> {
        if (!this.genAI) {
            await this.init();
        }

        try {
            // Prepare full prompt with system instruction
            let fullPrompt = prompt;
            if (options.systemInstruction) {
                fullPrompt = `${options.systemInstruction}\n\n${prompt}`;
            }

            // Simple, reliable format for Gemini
            if (!this.model) throw new Error("Modèle Gemini non initialisé");
            const result = await this.model.generateContent(fullPrompt);
            const response = result.response;
            const text = response.text();

            if (!text || text.trim() === "") {
                throw new Error("Gemini a retourné une réponse vide.");
            }

            return text;

        } catch (error) {
            console.error("Gemini Generation Error:", error);
            const msg = error instanceof Error ? error.message : "Erreur inconnue";

            // Better error messages
            if (msg.includes("API_KEY") || msg.includes("API key")) {
                throw new Error("Clé API Gemini invalide ou manquante. Vérifiez la clé.");
            }
            if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
                throw new Error("Quota Gemini dépassé. Veuillez attendre ou utiliser une autre clé.");
            }
            if (msg.includes("SAFETY")) {
                throw new Error("Contenu bloqué par les filtres de sécurité Gemini. Reformulez votre demande.");
            }

            throw new Error(`Erreur Gemini: ${msg}`);
        }
    }
}
