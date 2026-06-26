import { AIProvider, AIProviderId } from "./types";
import { GroqProvider } from "./groq";
import { PuterProvider } from "./puter";
import { LocalProvider } from "./local";
import { GeminiProvider } from "./gemini";

class AIManager {
    public providers: Partial<Record<AIProviderId, AIProvider>>;
    private activeProviderId: AIProviderId = 'local';

    constructor() {
        this.providers = {
            local: new LocalProvider(),
            groq: new GroqProvider(),
            puter: new PuterProvider(),
            gemini: new GeminiProvider(),
        };

        // Charger la préférence utilisateur
        const savedProvider = localStorage.getItem('PREFERRED_AI_PROVIDER') as AIProviderId;
        if (savedProvider && this.providers[savedProvider]) {
            this.activeProviderId = savedProvider;
        } else if (this.providers.groq?.isReady()) {
            this.activeProviderId = 'groq';
        } else {
            this.activeProviderId = 'puter';
        }
    }

    getActiveProvider(): AIProvider {
        return this.providers[this.activeProviderId];
    }

    getProviderId(): AIProviderId {
        return this.activeProviderId;
    }

    async setProvider(id: AIProviderId) {
        if (this.providers[id]) {
            // Si on change de provider, on peut vouloir libérer les ressources de l'ancien
            if (this.activeProviderId === 'local' && id !== 'local') {
                await this.providers.local.release?.();
            }
            this.activeProviderId = id;
            localStorage.setItem('PREFERRED_AI_PROVIDER', id);
        }
    }

    async init(progressCallback?: (data: Record<string, unknown>) => void) {
        return this.getActiveProvider().init(progressCallback);
    }

    /**
     * Génère du texte
     */
    async generateSection(
        prompt: string,
        options: {
            maxTokens?: number;
            temperature?: number;
            systemInstruction?: string
        } = {}
    ): Promise<string> {
        const provider = this.getActiveProvider();

        try {
            return await provider.generate(prompt, options);
        } catch (error) {
            console.error('Erreur AIManager:', error);
            throw error;
        }
    }

    isReady() {
        return this.getActiveProvider().isReady();
    }
}

export const aiManager = new AIManager();
