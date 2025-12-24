import { AIProvider } from './types';

// Puter.js integration
// Using the global puter object if available or fetch if needed.
// Based on user request "au lieu de mistral integrer Puter.js" 
// and "Standard: Puter.js (Puter.ai)"

/* 
 * NOTE: Dans un environnement Vite, l'intégration de Puter.js se fait souvent via un script dans index.html
 * ou via un appel direct si on a le script chargé.
 * Pour simplifier et assurer le typage, on va supposer que `puter` est défini globalement ou utiliser une approche fetch si possible.
 * Doc Puter.js: puter.ai.chat(prompt)
 */

declare const puter: unknown;

export class PuterProvider implements AIProvider {
    id = 'puter' as const;
    name = 'Puter.js (Standard)';

    isReady(): boolean {
        return typeof (window as unknown as { puter: unknown }).puter !== 'undefined';
    }

    async init(): Promise<void> {
        if (typeof (window as unknown as { puter: unknown }).puter === 'undefined') {
            // On pourrait tenter de charger dynamiquement le script ici si nécessaire
            console.warn("Puter.js n'est pas chargé. Assurez-vous d'avoir <script src=\"https://js.puter.com/v2/\"></script> dans index.html");
            // Mais on ne throw pas forcément bloquant pour laisser l'UI gérer
        }
    }

    async generate(prompt: string, options: { maxTokens?: number, temperature?: number, systemInstruction?: string } = {}): Promise<string> {
        const puterObj = (window as unknown as { puter: { ai: { chat: (p: string) => Promise<{ toString: () => string }> } } }).puter;
        if (!puterObj) {
            throw new Error("Puter.js n'est pas disponible. Vérifiez votre connexion ou la configuration.");
        }

        const system = options.systemInstruction ? `${options.systemInstruction}\n\n` : '';
        const fullPrompt = `${system}${prompt}`;

        try {
            const result = await puterObj.ai.chat(fullPrompt);

            if (typeof result === 'string') return result;
            if (result && typeof result === 'object' && 'message' in result && result.message && typeof result.message === 'object' && 'content' in result.message) return String(result.message.content);
            if (result && typeof result === 'object' && 'content' in result) return String(result.content);

            return String(result);

        } catch (error) {
            console.error("Puter Generation Error:", error);
            const msg = error instanceof Error ? error.message : "Erreur inconnue";
            throw new Error(`Erreur Puter: ${msg}`);
        }
    }
}
