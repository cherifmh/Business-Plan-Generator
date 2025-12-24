import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Check, ExternalLink, Zap, Laptop, Server, Box, Eye, EyeOff } from "lucide-react";
import { aiManager } from "@/lib/ai/manager";
import { toast } from "sonner";
import { AIProviderId } from "@/lib/ai/types";

export function AISettings() {
    const [provider, setProvider] = useState<AIProviderId>('local');
    const [isOpen, setIsOpen] = useState(false);

    // API Keys state
    const [groqKey, setGroqKey] = useState("");

    // Key visibility state
    const [showGroqKey, setShowGroqKey] = useState(false);

    // Model selection state
    const [groqModel, setGroqModel] = useState("llama-3.1-8b-instant");

    // Environment keys check
    const hasGroqEnv = !!import.meta.env.VITE_GROQ_API_KEY;

    useEffect(() => {
        if (isOpen) {
            setProvider(aiManager.getProviderId());
            setGroqKey(localStorage.getItem("GROQ_API_KEY") || "");
            setGroqModel(localStorage.getItem("GROQ_MODEL") || "llama-3.1-8b-instant");
        }
    }, [isOpen]);

    const handleSave = async () => {
        // Save keys
        if (groqKey.trim()) localStorage.setItem("GROQ_API_KEY", groqKey);

        // Save models
        localStorage.setItem("GROQ_MODEL", groqModel);

        // Update provider instances
        const providers = aiManager.providers;

        if (providers.groq) {
            const groqProv = providers.groq as unknown as { setApiKey?: (k: string) => void, setModel?: (m: string) => void };
            if (typeof groqProv.setApiKey === 'function') groqProv.setApiKey(groqKey);
            if (typeof groqProv.setModel === 'function') groqProv.setModel(groqModel);
        }

        await aiManager.setProvider(provider);

        toast.success("Configuration ANETI mise à jour");
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Mode Expert
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Configuration Expert ANETI</DialogTitle>
                    <DialogDescription>
                        Choisissez et configurez le moteur d'intelligence artificielle.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <RadioGroup value={provider} onValueChange={(v) => setProvider(v as AIProviderId)} className="grid gap-4">

                        {/* Option 1: Groq */}
                        <div className={`p-3 rounded-md border ${provider === 'groq' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                            <div className="flex items-start space-x-3">
                                <RadioGroupItem value="groq" id="groq" className="mt-1" />
                                <div className="flex-1 grid gap-1.5">
                                    <Label htmlFor="groq" className="font-semibold flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-amber-500" />
                                        Groq (Par défaut)
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Réponses instantanées via Llama 3. Clé par défaut disponible.
                                    </p>
                                    {provider === 'groq' && (
                                        <div className="mt-2 space-y-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Modèle</Label>
                                                <select
                                                    value={groqModel}
                                                    onChange={(e) => setGroqModel(e.target.value)}
                                                    className="w-full text-xs rounded border border-input bg-background px-3 py-1"
                                                >
                                                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Rapide)</option>
                                                    <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile (Expert)</option>
                                                    <option value="llama-3.2-11b-vision-preview">llama-3.2-11b-vision (Preview)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="groqKey" className="text-xs">Clé API Groq (Laisser vide pour défaut)</Label>
                                                {hasGroqEnv ? (
                                                    <div className="p-2 bg-muted rounded border text-xs flex items-center gap-2 text-green-600"><Check className="h-3 w-3" /> Configurée via ENV</div>
                                                ) : (
                                                    <div className="relative">
                                                        <Input
                                                            id="groqKey"
                                                            type={showGroqKey ? "text" : "password"}
                                                            value={groqKey}
                                                            onChange={e => setGroqKey(e.target.value)}
                                                            placeholder="gsk_..."
                                                            className="h-8 text-xs pr-8"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-0 top-0 h-8 w-8 text-muted-foreground"
                                                            onClick={() => setShowGroqKey(!showGroqKey)}
                                                        >
                                                            {showGroqKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Option 4: Puter.js */}
                        <div className={`flex items-start space-x-3 space-y-0 p-3 rounded-md border ${provider === 'puter' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                            <RadioGroupItem value="puter" id="puter" className="mt-1" />
                            <div className="grid gap-1.5">
                                <Label htmlFor="puter" className="font-semibold flex items-center gap-2">
                                    <Laptop className="h-4 w-4 text-purple-500" />
                                    Standard (Puter.js)
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Solution cloud standard, équilibrée et gratuite.
                                </p>
                            </div>
                        </div>

                        {/* Option 5: Local */}
                        <div className={`flex items-start space-x-3 space-y-0 p-3 rounded-md border ${provider === 'local' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                            <RadioGroupItem value="local" id="local" className="mt-1" />
                            <div className="grid gap-1.5">
                                <Label htmlFor="local" className="font-semibold flex items-center gap-2">
                                    <Server className="h-4 w-4 text-gray-500" />
                                    Serveur Interne (Local - Bientôt)
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Exécution sur votre machine. Non disponible pour le moment.
                                </p>
                            </div>
                        </div>

                    </RadioGroup>
                </div>
                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave}>Enregistrer la configuration</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
