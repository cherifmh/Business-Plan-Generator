import { AIProvider } from './types';

/**
 * Catalogue des modèles conversationnels Groq — SOURCE UNIQUE.
 *
 * Il sert à la fois à la sélection automatique (getBestAvailableModel) et au
 * sélecteur du « Mode Expert », afin d'éviter deux listes divergentes.
 * Les quotas sont ceux de l'offre gratuite Groq (relevé mars 2026) et sont
 * propres à chaque modèle : d'où l'intérêt de pouvoir en changer.
 *
 * La liste live renvoyée par l'API reste la source de vérité : un identifiant
 * absent de la clé de l'utilisateur est simplement ignoré.
 */
export interface GroqModelInfo {
    id: string;
    label: string;
    requestsPerDay: number;
    tokensPerMinute: number;
    deprecated?: boolean;
}

export const GROQ_CHAT_MODELS: GroqModelInfo[] = [
    { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B — meilleure qualité rédactionnelle", requestsPerDay: 1000, tokensPerMinute: 8000 },
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B — équilibré (recommandé)", requestsPerDay: 1000, tokensPerMinute: 12000 },
    { id: "moonshotai/kimi-k2-instruct", label: "Kimi K2 Instruct — rédaction", requestsPerDay: 1000, tokensPerMinute: 10000 },
    { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout — le plus rapide", requestsPerDay: 1000, tokensPerMinute: 30000 },
    { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B — léger", requestsPerDay: 1000, tokensPerMinute: 8000 },
    { id: "qwen/qwen3-32b", label: "Qwen3 32B — multilingue", requestsPerDay: 1000, tokensPerMinute: 6000 },
    { id: "groq/compound-mini", label: "Groq Compound Mini — agent", requestsPerDay: 250, tokensPerMinute: 70000 },
    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant — déprécié le 16 août 2026", requestsPerDay: 14400, tokensPerMinute: 6000, deprecated: true },
];

const CHAT_MODEL_IDS: string[] = GROQ_CHAT_MODELS.map((m) => m.id);

/** Motifs qui ne désignent jamais un modèle de génération de texte. */
const NON_CHAT_MODEL_PATTERN = /whisper|tts|speech|guard|embed|moderation|orpheus|rerank/i;

/** Durée de validité du cache de la liste des modèles (évite un appel /models à chaque essai). */
const MODELS_CACHE_TTL_MS = 10 * 60 * 1000;

export class GroqProvider implements AIProvider {
    id = 'groq' as const;
    name = 'Groq (Expert Rapide)';
    private apiKey: string = "";
    private selectedModel: string = "auto";
    /** Liste live des modèles ; initialisée sur le catalogue local avant le premier appel. */
    private availableModels: string[] = [...CHAT_MODEL_IDS];
    /** Modèles déjà en échec pendant la session : évite de les retester en boucle. */
    private failedModels = new Set<string>();
    /** Horodatage du dernier rafraîchissement réussi de la liste des modèles. */
    private modelsFetchedAt = 0;

    constructor() {
        this.apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("GROQ_API_KEY") || "";
        const savedModel = localStorage.getItem("GROQ_MODEL");
        if (savedModel && (savedModel === "auto" || CHAT_MODEL_IDS.includes(savedModel))) {
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
        // Nouvelle clé = droits et quotas différents : on repart d'une liste fraîche.
        this.modelsFetchedAt = 0;
        this.failedModels.clear();
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

    /**
     * Liste des modèles disponibles.
     *
     * Ne renvoie JAMAIS `undefined` : en cas de clé invalide, de quota atteint
     * ou de panne réseau, on retombe sur la dernière liste connue (le catalogue
     * local au premier appel). L'ancienne version ne retournait rien hors du
     * `if (response.ok)`, ce qui faisait planter l'appelant sur `models.includes`.
     */
    async fetchModels(force: boolean = false): Promise<string[]> {
        if (!this.apiKey) return this.availableModels;
        if (!force && Date.now() - this.modelsFetchedAt < MODELS_CACHE_TTL_MS) {
            return this.availableModels;
        }
        try {
            const response = await fetch("https://api.groq.com/openai/v1/models", {
                headers: { "Authorization": `Bearer ${this.apiKey}` }
            });
            if (response.ok) {
                const data = await response.json();
                const raw = data?.data;
                const ids: string[] = Array.isArray(raw)
                    ? raw
                        .map((m: { id?: unknown }) => String(m?.id ?? ""))
                        .filter((id: string) => id.length > 0)
                    : [];
                if (ids.length > 0) {
                    this.availableModels = ids;
                    this.modelsFetchedAt = Date.now();
                }
            } else {
                console.warn(`[Groq] Liste des modèles indisponible (${response.status}) — utilisation de la liste connue.`);
            }
        } catch (e) {
            console.error("Failed to fetch Groq models", e);
        }
        return this.availableModels;
    }

    /**
     * Meilleur modèle conversationnel réellement disponible :
     *  1. le catalogue local, dans l'ordre de préférence, parmi les modèles live ;
     *  2. sinon le premier modèle live qui n'est pas un modèle technique
     *     (transcription, modération, synthèse vocale…) ;
     *  3. sinon une erreur explicite, au lieu d'un identifiant supposé disponible.
     */
    async getBestAvailableModel(): Promise<string> {
        const models = await this.fetchModels();
        const usable = models.filter((id) => id !== "auto" && !this.failedModels.has(id));

        for (const model of GROQ_CHAT_MODELS) {
            if (usable.includes(model.id)) return model.id;
        }

        const fallback = usable.find((id) => !NON_CHAT_MODEL_PATTERN.test(id));
        if (fallback) {
            console.warn(`[Groq] Aucun modèle du catalogue disponible — repli sur ${fallback}`);
            return fallback;
        }

        throw new Error(
            "Aucun modèle de génération de texte n'est disponible avec cette clé Groq. " +
            "Vérifiez la clé (https://console.groq.com/keys) ou choisissez un modèle dans « Mode Expert »."
        );
    }

    async generate(prompt: string, options: { maxTokens?: number, temperature?: number, systemInstruction?: string, retries?: number } = {}): Promise<string> {
        if (!this.apiKey) {
            await this.init();
        }

        const url = "https://api.groq.com/openai/v1/chat/completions";

        const messages: Array<{ role: string; content: string }> = [];
        if (options.systemInstruction) {
            messages.push({ role: "system", content: options.systemInstruction });
        }
        messages.push({ role: "user", content: prompt });

        // Budget d'essais borné : 1 envoi + `retries` (3 par défaut).
        const maxAttempts = (options.retries !== undefined ? options.retries : 3) + 1;
        // Passe à true quand le modèle doit être (re)choisi automatiquement.
        let autoSelect = this.selectedModel === "auto";
        let rateLimitBackoffDone = false;
        let serverRetryDone = false;
        let lastErrorMessage = "";

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const modelToUse = autoSelect ? await this.getBestAvailableModel() : this.selectedModel;

            const body = {
                model: modelToUse,
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 1000
            };

            let response: Response;
            try {
                response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify(body)
                });
            } catch (networkError) {
                // Changer de modèle n'y changerait rien : le problème est le réseau.
                console.error("[Groq] Network error:", networkError);
                throw new Error("Connexion à Groq impossible. Vérifiez votre connexion internet puis réessayez.");
            }

            if (response.ok) {
                const data = await response.json();
                const content: string = data?.choices?.[0]?.message?.content || "";
                if (content.trim() !== "") return content;

                // Réponse vide : le modèle est écarté et on en essaie un autre.
                console.warn(`[Groq] Réponse vide de ${modelToUse}`);
                this.failedModels.add(modelToUse);
                lastErrorMessage = `Groq a renvoyé une réponse vide (${modelToUse}).`;
                autoSelect = true;
                continue;
            }

            const errorData = await response.json().catch(() => ({}));
            const status = response.status;
            const errCode = String(errorData?.error?.code ?? "");
            const errMsg: string = errorData?.error?.message || response.statusText || "";
            console.error(`[Groq] Erreur ${status} sur ${modelToUse}:`, errorData);

            // 1. Clé invalide : ni repli ni nouvel essai, le message doit être clair.
            if (status === 401 || status === 403) {
                throw new Error(
                    "Clé API Groq invalide ou révoquée. Corrigez-la dans « Mode Expert » (https://console.groq.com/keys)."
                );
            }

            // 2. Quota du modèle atteint : on respecte le délai annoncé, une seule fois.
            if (status === 429) {
                const retryAfter = Number(response.headers.get("retry-after"));
                const waitMs = Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000, 5000);
                if (!rateLimitBackoffDone) {
                    rateLimitBackoffDone = true;
                    console.warn(`[Groq] Quota atteint sur ${modelToUse} — nouvel essai dans ${Math.round(waitMs / 1000)} s.`);
                    await new Promise((resolve) => setTimeout(resolve, waitMs));
                    continue;
                }
                throw new Error(
                    `Quota gratuit atteint pour « ${modelToUse} ». ` +
                    "Les limites sont propres à chaque modèle : attendez une minute ou choisissez un autre modèle dans « Mode Expert »."
                );
            }

            // 3. Modèle indisponible ou décommissionné : on l'écarte pour la session
            //    et on repart sur la sélection automatique.
            const looksLikeModelError =
                status === 404 ||
                status === 400 ||
                /model/i.test(errCode) ||
                /decommission|does not exist|not found|no longer supported/i.test(errMsg);

            if (looksLikeModelError) {
                console.warn(`[Groq] Modèle indisponible (${modelToUse}) — exclusion et nouvel essai.`);
                this.failedModels.add(modelToUse);
                lastErrorMessage = `Modèle Groq indisponible (${modelToUse}) : ${errMsg}`;
                autoSelect = true;
                continue;
            }

            // 4. Erreur passagère côté serveur : un seul nouvel essai, même modèle.
            if (status >= 500 && !serverRetryDone && attempt < maxAttempts) {
                serverRetryDone = true;
                await new Promise((resolve) => setTimeout(resolve, 1000));
                continue;
            }

            lastErrorMessage = `Erreur Groq (${status}) : ${errMsg}`;
            break;
        }

        throw new Error(lastErrorMessage || "Erreur Groq inconnue.");
    }
}
