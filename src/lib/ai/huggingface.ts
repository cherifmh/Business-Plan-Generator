import { AIProvider } from './types';

export class HuggingFaceProvider implements AIProvider {
    id = 'huggingface' as const;
    name = 'Hugging Face (Multi-Modèles)';
    private apiKey: string = "";
    private defaultKey = "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";
    private selectedModel: string = "mistralai/Mistral-7B-Instruct-v0.3";

    constructor() {
        this.apiKey = import.meta.env.VITE_HF_API_TOKEN || localStorage.getItem("HF_API_TOKEN") || this.defaultKey;
        const savedModel = localStorage.getItem("HF_MODEL");
        if (savedModel) this.selectedModel = savedModel;
    }

    isReady(): boolean {
        return !!this.apiKey;
    }

    setApiKey(key: string) {
        this.apiKey = key;
        localStorage.setItem("HF_API_TOKEN", key);
    }

    setModel(model: string) {
        this.selectedModel = model;
        localStorage.setItem("HF_MODEL", model);
    }

    getSelectedModel() {
        return this.selectedModel;
    }

    async init(): Promise<void> {
        if (!this.apiKey) {
            throw new Error("Token Hugging Face manquant.");
        }
    }

    async generate(prompt: string, options: { maxTokens?: number, temperature?: number, systemInstruction?: string } = {}): Promise<string> {
        if (!this.apiKey) {
            await this.init();
        }

        // Use standard Hugging Face Inference API
        const url = `https://api-inference.huggingface.co/models/${this.selectedModel}`;

        // Format prompt based on model type
        let inputs = prompt;

        // For Mistral and chat models, format as chat template
        if (this.selectedModel.includes("Mistral") || this.selectedModel.includes("Qwen")) {
            const systemPrompt = options.systemInstruction || "You are a helpful assistant specialized in writing business plans.";
            inputs = `<s>[INST] ${systemPrompt}\n\n${prompt} [/INST]`;
        }
        // For Flan-T5 and other seq2seq models
        else if (this.selectedModel.includes("flan") || this.selectedModel.includes("t5")) {
            if (options.systemInstruction) {
                inputs = `${options.systemInstruction}\n\nQuestion: ${prompt}\nAnswer:`;
            } else {
                inputs = prompt;
            }
        }

        const body = {
            inputs: inputs,
            parameters: {
                max_new_tokens: options.maxTokens || 800,
                temperature: options.temperature || 0.7,
                return_full_text: false,
                wait_for_model: true,
                do_sample: true
            },
            options: {
                wait_for_model: true,
                use_cache: false
            }
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorObj: Record<string, unknown> = {};

                try {
                    errorObj = JSON.parse(errorText) as Record<string, unknown>;
                } catch {
                    errorObj = { error: errorText };
                }

                // Handle specific errors
                if (response.status === 503) {
                    const estimatedTime = Number(errorObj.estimated_time) || 20;
                    throw new Error(`Le modèle ${this.selectedModel} est en cours de chargement. Veuillez réessayer dans ${Math.ceil(estimatedTime)} secondes.`);
                }

                if (response.status === 401 || response.status === 403) {
                    throw new Error("Clé API Hugging Face invalide ou expirée. Vérifiez votre token.");
                }

                if (response.status === 400) {
                    throw new Error(`Erreur de requête HF: ${errorObj.error || errorText}. Vérifiez le format de votre prompt.`);
                }

                throw new Error(`Erreur HF (${response.status}): ${String(errorObj.error || errorText)}`);
            }

            const data = await response.json() as Array<{ generated_text?: string }> | { generated_text?: string } | string;

            // Parse response based on format
            let generatedText = "";

            if (Array.isArray(data)) {
                // Standard format: [{ generated_text: "..." }]
                const first = data[0];
                if (first && typeof first === 'object' && 'generated_text' in first && first.generated_text) {
                    generatedText = first.generated_text;
                } else if (typeof first === 'string') {
                    generatedText = first;
                }
            } else if (typeof data === 'object' && data !== null && 'generated_text' in data && data.generated_text) {
                generatedText = data.generated_text;
            } else if (typeof data === 'string') {
                generatedText = data;
            }

            if (!generatedText || generatedText.trim() === "") {
                throw new Error("Hugging Face a retourné une réponse vide. Le modèle n'a peut-être pas compris la requête.");
            }

            return generatedText.trim();

        } catch (error) {
            console.error("Hugging Face Generation Error:", error);
            const msg = error instanceof Error ? error.message : "Erreur inconnue";

            // Re-throw with message if already formatted
            if (msg.includes("HF") || msg.includes("Hugging Face")) {
                throw error;
            }

            throw new Error(`Erreur Hugging Face: ${msg}`);
        }
    }
}
