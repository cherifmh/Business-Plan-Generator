import { pipeline, env, Pipeline } from '@xenova/transformers';
import { AIProvider } from './types';

// Configuration pour l'environnement navigateur
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_NAME = 'Xenova/LaMini-Flan-T5-783M';
const TASK = 'text2text-generation';

export class LocalProvider implements AIProvider {
    id = 'local' as const;
    name = 'Local AI (In-Browser)';
    private generator: Pipeline | null = null;
    private isModelLoading = false;

    isReady(): boolean {
        return !!this.generator;
    }

    async init(progressCallback?: (data: Record<string, unknown>) => void): Promise<void> {
        if (this.generator) return;
        if (this.isModelLoading) return;

        this.isModelLoading = true;
        try {
            console.log(`Chargement du modèle ${MODEL_NAME}...`);
            this.generator = (await pipeline(TASK, MODEL_NAME, {
                progress_callback: (data: Record<string, unknown>) => {
                    if (progressCallback) {
                        progressCallback(data);
                    }
                },
            })) as unknown as Pipeline;
            console.log('Modèle chargé avec succès.');
        } catch (error) {
            console.error('Erreur lors du chargement du modèle IA:', error);
            throw new Error("Impossible de charger le modèle IA localement.");
        } finally {
            this.isModelLoading = false;
        }
    }

    async generate(prompt: string, options: { maxTokens?: number; temperature?: number; systemInstruction?: string } = {}): Promise<string> {
        if (!this.generator) {
            await this.init();
        }

        if (!this.generator) {
            throw new Error("Le générateur IA n'est pas initialisé.");
        }

        const fullPrompt = options.systemInstruction
            ? `${options.systemInstruction}\n\n${prompt}`
            : `Rédige une section de business plan professionnelle sur le sujet suivant : ${prompt}`;

        const generateOptions = {
            max_new_tokens: options.maxTokens || 400,
            temperature: options.temperature || 0.7,
            do_sample: true,
            top_k: 50,
        };

        try {
            const output = await this.generator(fullPrompt, generateOptions) as Array<{ generated_text: string }>;
            const text = output[0]?.generated_text || "";
            return text.trim();
        } catch (error) {
            console.error("Erreur lors de la génération:", error);
            throw error;
        }
    }

    async release(): Promise<void> {
        if (this.generator) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (typeof this.generator.dispose === 'function') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                await this.generator.dispose();
            }
            this.generator = null;
        }
        this.isModelLoading = false;
    }
}
