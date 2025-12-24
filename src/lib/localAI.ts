import { pipeline, env, Pipeline } from '@xenova/transformers';

// Configuration pour l'environnement navigateur
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton pour stocker l'instance du pipeline
let generator: Pipeline | null = null;
let isModelLoading = false;

// Modèle choisi : Phi-3 mini si compatible, sinon un fallback robuste T5
// Utilisation de LaMini-Flan-T5-783M pour la compatibilité et performance garantie en v2.17
// Si vous préférez Phi-3, changez vers 'Xenova/Phi-3-mini-4k-instruct' et task: 'text-generation'
const MODEL_NAME = 'Xenova/LaMini-Flan-T5-783M';
const TASK = 'text2text-generation';

export interface AIStatus {
    status: 'idle' | 'loading' | 'ready' | 'generating' | 'error';
    message?: string;
    progress?: number;
}

// Store progress callback
let currentProgressCallback: ((data: Record<string, unknown>) => void) | null = null;

export async function initAI(
    progressCallback?: (data: Record<string, unknown>) => void
): Promise<void> {
    if (generator) return;
    if (isModelLoading) return;

    isModelLoading = true;
    currentProgressCallback = progressCallback || null;

    try {
        console.log(`Chargement du modèle ${MODEL_NAME}...`);

        // Tentative de chargement avec WebGPU si possible (automatique souvent, mais on peut forcer options)
        // Pour @xenova/transformers v2, le device est souvent auto.
        generator = (await pipeline(TASK, MODEL_NAME, {
            progress_callback: (data: Record<string, unknown>) => {
                if (currentProgressCallback) {
                    currentProgressCallback(data);
                }
            },
        })) as unknown as Pipeline;

        console.log('Modèle chargé avec succès.');
    } catch (error) {
        console.error('Erreur lors du chargement du modèle IA:', error);
        throw new Error("Impossible de charger le modèle IA localement.");
    } finally {
        isModelLoading = false;
    }
}

export async function generateSection(
    prompt: string,
    options: {
        max_new_tokens?: number;
        temperature?: number;
        progressCallback?: (text: string) => void;
    } = {}
): Promise<string> {
    if (!generator) {
        await initAI();
    }

    if (!generator) {
        throw new Error("Le générateur IA n'est pas initialisé.");
    }

    // Configuration par défaut optimisée pour la génération de texte structuré
    const generateOptions = {
        max_new_tokens: options.max_new_tokens || 400,
        temperature: options.temperature || 0.7,
        do_sample: true,
        top_k: 50,
        // Callback pour le streaming si supporté par le pipeline/modèle
        callback_function: () => {
            // Simple hook si on voulait streamer, mais pour ce sprint on reste sur Promise
        }
    };

    try {
        // Génération
        // Pour text2text (T5), le prompt est direct.
        // Ajouter une instruction system-like pour T5
        const fullPrompt = `Rédige une section de business plan professionnelle sur le sujet suivant : ${prompt}`;

        const output = await generator(fullPrompt, generateOptions) as Array<{ generated_text: string }>;

        // Le format de sortie dépend de la tâche
        // text2text-generation -> [{ generated_text: string }]
        // text-generation -> [{ generated_text: string }]

        const text = (output[0]?.generated_text || "").trim();

        return text;
    } catch (error) {
        console.error("Erreur lors de la génération:", error);
        throw error;
    }
}

export async function releaseAI(): Promise<void> {
    if (generator) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (typeof generator.dispose === 'function') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            await generator.dispose();
        }
        generator = null;
    }
    isModelLoading = false;
    console.log("Ressources IA libérées.");
}

export function isAIReady(): boolean {
    return !!generator;
}
