import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, Check, X, Wand2 } from "lucide-react";
import { aiManager } from "@/lib/ai/manager";
import { toast } from "sonner";
import { Loader } from "./Loader";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { BusinessPlanData } from "@/types/businessPlan";

interface SectionGeneratorProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    description?: string;
    context?: string;
    disabled?: boolean;
    businessPlanData?: BusinessPlanData;
}

export function SectionGenerator({
    id,
    label,
    value,
    onChange,
    placeholder,
    description,
    context,
    disabled,
    businessPlanData
}: SectionGeneratorProps) {
    const [status, setStatus] = useState<'idle' | 'loading-model' | 'generating'>('idle');
    const [progress, setProgress] = useState(0);
    const [proposal, setProposal] = useState<string | null>(null);
    const [isProposalOpen, setIsProposalOpen] = useState(false);

    const handleGenerate = async () => {
        setStatus('loading-model');
        setProgress(0);

        try {
            // 1. Initialisation
            await aiManager.init((data: Record<string, unknown>) => {
                if (data.status === 'progress' && typeof data.file === 'string' && data.file.endsWith('.onnx')) {
                    setProgress(Math.round(Number(data.progress) || 0));
                }
            });

            // 2. Génération proprement dite
            setStatus('generating');

            // Construction du contexte global
            let globalContext = "";
            if (businessPlanData) {
                globalContext = `
CONTEXTE GLOBAL DU BUSINESS PLAN:
Nom de l'entreprise: ${businessPlanData.companyName || "Non défini"}
Secteur: ${businessPlanData.industry || "Non défini"}
Mission: ${businessPlanData.missionStatement || "Non défini"}
                `.trim();
            }

            const ANETI_SYSTEM_PROMPT = `
Rôle : Tu es l'Expert Senior en Entrepreneuriat de l'ANETI (Tunisie). Ton rôle est d'aider les porteurs de projets à transformer leurs idées brutes en un Plan d'Affaires (Business Plan) professionnel.

Directives :
1. Vocabulaire : Utilise un langage soutenu et technique (ex: "stratégie de commercialisation" au lieu de "vendre").
2. Structure : Organise la réponse de manière claire (Points clés, Analyse, Conclusion).
3. Adaptation : Si le texte est incomplet, propose des suggestions pour l'enrichir.
4. Identité : Tu agis au nom de l'ANETI. Ton ton est institutionnel, bienveillant et rigoureux.
5. Interdiction : Ne mentionne jamais les détails techniques de l'IA.
            `.trim();

            const isReformulation = value && value.length > 10;
            const promptContext = `${description || label}. ${context || ''}`;

            let fullPrompt = "";
            let systemInst = "";

            if (isReformulation) {
                systemInst = `${ANETI_SYSTEM_PROMPT}\n\nTâche : Reformuler et professionnaliser le texte utilisateur.`;
                fullPrompt = `
${globalContext}

SECTION À TRAITER: ${label}
DESCRIPTION: ${promptContext}

TEXTE ORIGINAL DE L'UTILISATEUR (A REFORMULER - MODE ANETI):
"${value}"

Veuillez proposer une version améliorée et professionnelle.
                 `;
            } else {
                systemInst = `${ANETI_SYSTEM_PROMPT}\n\nTâche : Rédiger une section de business plan.`;
                fullPrompt = `
${globalContext}

SECTION À REDIGER: ${label}
INSTRUCTIONS: ${promptContext}
${value ? `(Inspiration: "${value}")` : ''}

Rédige cette section avec l'expertise ANETI.
                `;
            }

            const generated = await aiManager.generateSection(fullPrompt, {
                maxTokens: 1500, // Augmenté pour l'expert
                temperature: 0.7,
                systemInstruction: systemInst
            });

            if (generated) {
                setProposal(generated);
                setIsProposalOpen(true);
                toast.success("Proposition générée !");
            } else {
                toast.warning("Aucun texte généré");
            }
        } catch (error) {
            console.error(error);
            const msg = error instanceof Error ? error.message : "Erreur inconnue";
            if (msg.includes('Clé API')) {
                toast.error("Clé API manquante. Ouvrez les paramètres IA pour la configurer.");
            } else {
                toast.error("Erreur de génération IA: " + msg);
            }
        } finally {
            setStatus('idle');
            setProgress(0);
        }
    };

    const handleAcceptProposal = () => {
        if (proposal) {
            onChange(proposal);
            setIsProposalOpen(false);
            setProposal(null);
            toast.success("Proposition adoptée !");
        }
    };

    return (
        <div className="space-y-2 relative group">
            <Dialog open={isProposalOpen} onOpenChange={setIsProposalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Proposition de l'IA</DialogTitle>
                        <DialogDescription>
                            Voici une suggestion de reformulation basée sur votre texte et le contexte du projet.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-4 bg-muted/50 rounded-md border min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                        {proposal}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsProposalOpen(false)}>
                            <X className="w-4 h-4 mr-2" />
                            Ignorer
                        </Button>
                        <Button onClick={handleAcceptProposal}>
                            <Check className="w-4 h-4 mr-2" />
                            Adopter cette version
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between">
                <Label htmlFor={id} className="text-base font-semibold text-foreground/90">
                    {label}
                </Label>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={disabled || status !== 'idle'}
                    className={`text-xs gap-2 transition-all ${status !== 'idle' ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5 hover:text-primary'}`}
                >
                    {status !== 'idle' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Wand2 className="h-3.5 w-3.5" />
                    )}
                    {status === 'loading-model' ? `Chargement modèle ${progress > 0 ? `${progress}%` : ''}` :
                        status === 'generating' ? 'Rédaction...' :
                            (value && value.length > 0 ? 'Reformuler avec IA' : 'Générer avec IA')}
                </Button>
            </div>

            {description && (
                <p className="text-sm text-muted-foreground leading-snug">{description}</p>
            )}

            <div className="relative">
                <Textarea
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={6}
                    className="resize-none focus-visible:ring-primary/30 min-h-[150px]"
                    disabled={disabled || status === 'generating'}
                />
                {status === 'generating' && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-md border border-primary/10">
                        <Loader text="L'IA rédige votre contenu..." className="bg-background/80 p-3 rounded-full shadow-lg border" />
                    </div>
                )}
            </div>
        </div>
    );
}
