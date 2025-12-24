import { AIProvider, AIProviderId } from "./types";
import { GroqProvider } from "./groq";
import { PuterProvider } from "./puter";
import { LocalProvider } from "./local";

class AIManager {
    public providers: Record<AIProviderId, AIProvider>;
    private activeProviderId: AIProviderId = 'local';
    private cache: Map<string, string> = new Map();

    constructor() {
        this.providers = {
            local: new LocalProvider(),
            groq: new GroqProvider(),
            puter: new PuterProvider(),
        };

        // Charger la préférence utilisateur
        const savedProvider = localStorage.getItem('PREFERRED_AI_PROVIDER') as AIProviderId;
        // Par défaut, on utilise Groq comme provider principal
        if (savedProvider && this.providers[savedProvider]) {
            this.activeProviderId = savedProvider;
        } else {
            this.activeProviderId = 'groq';
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
     * Génère du texte avec mise en cache
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

        // Clé de cache incluant le provider, le prompt et les options
        const cacheKey = JSON.stringify({
            provider: provider.id,
            prompt,
            options
        });

        if (this.cache.has(cacheKey)) {
            console.log('Retour depuis le cache');
            return this.cache.get(cacheKey)!;
        }

        try {
            const result = await provider.generate(prompt, options);
            this.cache.set(cacheKey, result);
            return result;
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
