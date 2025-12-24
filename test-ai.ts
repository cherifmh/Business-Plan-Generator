// Test de diagnostic des providers AI
import { aiManager } from './lib/ai/manager';

async function testProviders() {
    const providers = ['groq', 'huggingface', 'gemini', 'mistral', 'puter'];

    for (const providerId of providers) {
        console.log(`\n========== Test de ${providerId} ==========`);
        try {
            await aiManager.setProvider(providerId as any);
            const provider = (aiManager as any).providers[providerId];

            console.log(`Provider: ${provider.name}`);
            console.log(`Ready: ${provider.isReady()}`);

            // Test simple
            const result = await aiManager.generate("Bonjour, réponds en un mot.", { maxTokens: 50 });
            console.log(`✅ ${providerId} fonctionne: ${result.substring(0, 50)}...`);

        } catch (error: any) {
            console.error(`❌ Erreur ${providerId}:`, error.message);
        }
    }
}

testProviders();
