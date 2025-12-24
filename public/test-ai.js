// Test simple des providers AI
// Ouvrez la console du navigateur (F12) pour voir les résultats

console.log("🧪 Démarrage des tests AI...");

// Test Hugging Face
async function testHuggingFace() {
    const HF_KEY = "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";
    const model = "mistralai/Mistral-7B-Instruct-v0.3";
    
    try {
        console.log("📝 Test Hugging Face avec Mistral-7B...");
        
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: "<s>[INST] Tu es un assistant. Réponds en un mot: Bonjour? [/INST]",
                parameters: {
                    max_new_tokens: 50,
                    temperature: 0.7,
                    return_full_text: false,
                    wait_for_model: true
                },
                options: {
                    wait_for_model: true
                }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("❌ HF Error:", data);
            if (response.status === 503) {
                console.log("⏳ Modèle en chargement. Temps estimé:", data.estimated_time, "secondes");
            }
        } else {
            console.log("✅ HF Response:", data);
        }
    } catch (error) {
        console.error("❌ HF Exception:", error);
    }
}

// Test Gemini
async function testGemini() {
    const GEMINI_KEY = "AIzaSyCRM2HxU7B-VwY9zyzx1EwtYnYA5BMJNDo";
    
    try {
        console.log("📝 Test Google Gemini...");
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Réponds en un mot: Bonjour?"
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("❌ Gemini Error:", data);
        } else {
            console.log("✅ Gemini Response:", data);
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                console.log("📄 Texte:", data.candidates[0].content.parts[0].text);
            }
        }
    } catch (error) {
        console.error("❌ Gemini Exception:", error);
    }
}

// Lancer les tests
testHuggingFace();
setTimeout(() => testGemini(), 2000);

console.log("✅ Tests lancés. Vérifiez les résultats ci-dessus.");
