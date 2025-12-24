import { AIProvider } from './types';

export class MistralProvider implements AIProvider {
    id = 'mistral' as const;
    name = 'Mistral AI';
    private apiKey: string = "";
    private defaultKey = "Zi0AJ98U8dAdFozWHjlpIMna3HGNGlLZ";

    constructor() {
        // Automatically integrer la clé s'il y en a une dans l'environnement
        this.apiKey = import.meta.env.VITE_MISTRAL_API_KEY || localStorage.getItem("MISTRAL_API_KEY") || this.defaultKey;
    }

    isReady(): boolean {
        return !!this.apiKey;
    }

    setApiKey(key: string) {
        this.apiKey = key;
        localStorage.setItem("MISTRAL_API_KEY", key);
    }

    async init(): Promise<void> {
        if (!this.apiKey) {
            throw new Error("Clé API Mistral manquante. Veuillez la configurer dans les paramètres.");
        }
        // Pas d'initialisation de client SDK nécessaire avec fetch
    }

    async generate(prompt: string, options: { maxTokens?: number, temperature?: number, systemInstruction?: string } = {}): Promise<string> {
        if (!this.apiKey) {
            await this.init();
        }

        const url = "https://api.mistral.ai/v1/chat/completions";

        // Construction des messages
        const messages = [];
        if (options.systemInstruction) {
            messages.push({ role: "system", content: options.systemInstruction });
        } else {
            messages.push({ role: "system", content: "You are a helpful assistant specialized in writing business plans." });
        }
        messages.push({ role: "user", content: prompt });

        const body = {
            model: "mistral-small-latest", // Mise à jour selon la demande utilisateur
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1000
        };

        const fetchOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(body)
        };

        try {
            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Erreur d'authentification : Vérifiez votre clé API.");
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Erreur Mistral (${response.status}): ${errorData.message || response.statusText}`);
            }

            const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };

            // Validation basique de la réponse
            if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
                return "";
            }

            return data.choices[0].message.content || "";

        } catch (error) {
            console.error("Erreur lors de l'appel Mistral :", error);
            const msg = error instanceof Error ? error.message : "Erreur lors de la génération Mistral";
            throw new Error(msg);
        }
    }
}
