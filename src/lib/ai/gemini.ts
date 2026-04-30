import { AIProvider } from './types';
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Cache for models per API key (session-level cache)
const modelsCache: Map<string, { models: string[], timestamp: number }> = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

interface GeminiModel {
    name: string;
    supportedGenerationMethods?: string[];
}

interface GeminiModelsResponse {
    models?: GeminiModel[];
}

/**
 * Fetches available Gemini models from the API
 * Filters: supports generateContent, contains 'gemini', excludes embedding/aqa
 * Sorts: alphabetically descending (newest first)
 * Caches: per session per API key
 */
export async function fetchGeminiModels(apiKey: string): Promise<string[]> {
    // Check cache first
    const cached = modelsCache.get(apiKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.models;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status}`);
        }

        const data: GeminiModelsResponse = await response.json();

        if (!data.models || !Array.isArray(data.models)) {
            throw new Error("Invalid models response");
        }

        // Filter models:
        // 1. Support generateContent
        // 2. Contain 'gemini' in name
        // 3. Exclude embedding models
        // 4. Exclude aqa models
        const filteredModels = data.models.filter((model: GeminiModel) => {
            const name = model.name || '';
            const methods = model.supportedGenerationMethods || [];

            return (
                methods.includes('generateContent') &&
                name.toLowerCase().includes('gemini') &&
                !name.toLowerCase().includes('embedding') &&
                !name.toLowerCase().includes('aqa')
            );
        });

        // Extract model names and sort alphabetically descending (newest first)
        const modelNames = filteredModels
            .map(m => m.name.replace('models/', '')) // Remove 'models/' prefix
            .sort((a, b) => b.localeCompare(a)); // Descending alphabetical order

        // Cache the result
        modelsCache.set(apiKey, {
            models: modelNames,
            timestamp: Date.now()
        });

        return modelNames;
    } catch (error) {
        console.error("Error fetching Gemini models:", error);
        // Return fallback models if API call fails
        return ['gemini-1.5-flash-latest', 'gemini-1.5-flash'];
    }
}

/**
 * Get the best available Gemini model (most recent)
 */
export async function getBestGeminiModel(apiKey: string): Promise<string> {
    const models = await fetchGeminiModels(apiKey);
    return models[0] || 'gemini-1.5-flash';
}

export class GeminiProvider implements AIProvider {
    id = 'gemini' as const;
    name = 'Google Gemini';
    private apiKey: string = "";
    // Default hardcoded key as requested
    private defaultKey = "AIzaSyCRM2HxU7B-VwY9zyzx1EwtYnYA5BMJNDo";
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;
    private currentModelName: string = "gemini-1.5-flash";

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
        this.model = null;
    }

    async init(): Promise<void> {
        if (!this.apiKey) {
            // Fallback to default if somehow empty
            this.apiKey = this.defaultKey;
        }
        this.genAI = new GoogleGenerativeAI(this.apiKey);

        // Fetch the best available model dynamically
        this.currentModelName = await getBestGeminiModel(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: this.currentModelName });
    }

    getCurrentModel(): string {
        return this.currentModelName;
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
