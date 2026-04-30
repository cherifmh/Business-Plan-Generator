import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Wand2 } from "lucide-react";
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
import { generateAnalysis } from "@/utils/businessAnalysis";
import { calculateOperatingResults, calculateFinancialPlan } from "@/utils/financialCalculations";

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

            // Construction du contexte global enrichi
            let globalContext = "";
            if (businessPlanData) {
                const fmtN = (n?: number) => n !== undefined && n > 0
                    ? new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(n)
                    : "Non renseigné";

                // Calculs financiers
                let finBlock = "";
                try {
                    const results = calculateOperatingResults(businessPlanData);
                    const fp = calculateFinancialPlan(businessPlanData);
                    const s = results.summary;
                    const firstIdx = businessPlanData.includeYearZero ? 1 : 0;
                    const opYears = results.years.slice(firstIdx);
                    const y1 = opYears[0];
                    const avgNetMargin = opYears.length
                        ? (opYears.reduce((acc, y) => acc + (y.turnover > 0 ? (y.netResult / y.turnover) * 100 : 0), 0) / opYears.length)
                        : 0;

                    finBlock = [
                        `CA An1: ${fmtN(y1?.turnover)} | CA Croisière (An${businessPlanData.cruiseYear}): ${fmtN(s.cruiseYearData.turnover)}`,
                        `Résultat net croisière: ${fmtN(s.cruiseYearData.netResult)} | Marge nette moyenne: ${avgNetMargin.toFixed(1)}%`,
                        `VAN: ${fmtN(s.van)} | TRI: ${s.roi?.toFixed(1) ?? "N/A"}% | Délai récupération: ${s.payback ? `${s.payback.years} an(s) ${s.payback.months} mois` : "Non récupéré"}`,
                        `Investissement total: ${fmtN((businessPlanData.investmentCost || 0))} | Apport: ${fmtN(businessPlanData.personalContribution)} | Crédit: ${fmtN(businessPlanData.loanAmount)}`,
                        `Plan financement: ${Math.abs(fp.gap) < 1 ? "ÉQUILIBRÉ ✓" : `DÉSÉQUILIBRÉ (écart ${fmtN(fp.gap)})`}`,
                    ].join("\n");
                } catch (_) {
                    finBlock = "Données financières non disponibles.";
                }

                // Analyse structurée
                let analysisBlock = "";
                try {
                    const analysis = generateAnalysis(businessPlanData);
                    if (analysis) {
                        analysisBlock = [
                            `Secteur: ${analysis.sector} | Activité: ${analysis.profile.activity_type}`,
                            `Modèle revenus: ${analysis.profile.revenue_model} | Canal: ${analysis.profile.sales_channel} | Client: ${analysis.profile.customer_type.join(", ")}`,
                            `Digital: ${analysis.attributes.digital ? "oui" : "non"} | Scalabilité: ${analysis.attributes.scalable} | Revenus récurrents: ${analysis.attributes.recurring_revenue ? "oui (partiel ou total)" : "non"}`,
                            `Intensité CAPEX: ${analysis.attributes.capex} | Complexité opérationnelle: ${analysis.attributes.operational_complexity}`,
                            `Coûts clés: ${analysis.costs.join(", ")} | Risques: ${analysis.risks.join(", ")}`,
                        ].join("\n");
                    }
                } catch (_) {
                    analysisBlock = "";
                }

                globalContext = [
                    `CONTEXTE DU PROJET :`,
                    `Entreprise: ${businessPlanData.companyName || businessPlanData.projectTitle || "Non défini"}`,
                    `Secteur / Industrie: ${businessPlanData.industry || businessPlanData.projectSector || "Non défini"}`,
                    `Mission: ${businessPlanData.missionStatement || "Non défini"}`,
                    `Promoteur: ${businessPlanData.promoterName || "Non défini"} (${businessPlanData.experienceYears || 0} ans d'expérience)`,
                    ``,
                    `INDICATEURS FINANCIERS CLÉS :`,
                    finBlock,
                    analysisBlock ? `\nPROFIL D'ACTIVITÉ :\n${analysisBlock}` : "",
                ].filter(Boolean).join("\n").trim();
            }

            const ANETI_SYSTEM_PROMPT = `
Tu es un Expert Financier senior rédigeant des Business Plans ANETI (Tunisie).

RÈGLES STRICTES — applique-les impérativement :
1. FORMAT UNIQUE : Un seul paragraphe de 3 à 5 phrases maximum. Aucun titre, aucune puce, aucune numérotation (sauf instruction contraire spécifique).
2. STYLE DIRECT : Phrases courtes, verbes d'action. Pas d'introduction ("Voici", "Le projet vise à"), pas de conclusion ("En résumé", "Ainsi"). Commence immédiatement par le fond.
3. CONTENU FACTUEL : Chaque phrase apporte une donnée concrète, un chiffre ou une information actionable. Supprime tout adjectif superflu.
4. CONTEXTE INTÉGRÉ : Utilise implicitement les données fournies (CA, marge, secteur) sans les citer mécaniquement. Syntèse, non inventaire.
5. LONGUEUR : Maximum 80-100 mots. Sois lapidaire — si tu peux supprimer un mot sans perdre le sens, fais-le.
6. NOM DU PROMOTEUR : Ne mentionne le nom du promoteur que dans les sections évaluant ses compétences (editorAdvice). Dans les autres sections, parle du "promoteur" ou "l'entrepreneur" de manière générale, sauf si nécessaire pour la compréhension.
            `.trim();

            // FFOM sections require bullet points format
            const isFFOMSection = ['strengths', 'weaknesses', 'opportunities', 'threats'].includes(id);

            const isReformulation = value && value.length > 10;
            const promptContext = `${description || label}. ${context || ''}`;

            let fullPrompt = "";
            let systemInst = "";

            if (isReformulation) {
                if (isFFOMSection) {
                    systemInst = `${ANETI_SYSTEM_PROMPT}\n\nMission : Reformuler sous forme de 3 à 5 puces (tirés). Chaque puce = une idée concise. Conserver l'intention originale.`;
                    fullPrompt = [
                        globalContext ? `CONTEXTE : ${globalContext.split('\n')[0]}` : '',
                        `SECTION FFOM : ${label}`,
                        `TEXTE SOURCE : "${value.substring(0, 500)}${value.length > 500 ? '...' : ''}"`,
                        ``,
                        `→ Liste reformulée (puces) :`
                    ].filter(Boolean).join('\n');
                } else {
                    systemInst = `${ANETI_SYSTEM_PROMPT}\n\nMission : Reformuler en 3-5 phrases maximum. Conserver l'intention et les chiffres. Supprimer tout le superflu.`;
                    fullPrompt = [
                        globalContext ? `CONTEXTE : ${globalContext.split('\n')[0]} | ${globalContext.split('\n')[4] || ''}` : '',
                        `SECTION : ${label}`,
                        `TEXTE SOURCE : "${value.substring(0, 500)}${value.length > 500 ? '...' : ''}"`,
                        ``,
                        `→ Rédige immédiatement le paragraphe reformulé :`
                    ].filter(Boolean).join('\n');
                }
            } else {
                // Instructions spécifiques selon la section - ultra concises
                const sectionGuidance: Record<string, string> = {
                    conclusion: "POINT DE VUE : Rédacteur du projet (1ère personne 'nous' ou 'le projet'). Présenter les forces et atouts du projet de manière engageante. Ne pas citer les ratios financiers bruts, mais évoquer la rentabilité et la viabilité en termes qualitatifs. Ton confiant mais pas arrogant.",
                    editorAdvice: "POINT DE VUE : Conseiller ANETI (3ème personne objective). Évaluer le projet avec des critères financiers (VAN, TRI, marge, délai de récupération). Analyser la cohérence entre le profil du promoteur et l'activité. DONNER UN AVIS CLAIR sur le financement (favorable, réserves, ou défavorable). Utiliser les chiffres pour justifier. Ton professionnel, distancié, factuel.",
                    financingJustification: "Montant + usage + capacité de remboursement. Chiffres.",
                    creditJustification: "Besoin crédit + garanties + rentabilité. Direct.",
                    marketAnalysis: "Positionnement + cible + concurrents. 3 phrases.",
                    marketingStrategy: "Canaux + actions + budget. Concret.",
                    operationalPlan: "Processus + ressources + calendrier.",
                    riskAnalysis: "Risques + mitigations. Sans dramatisation.",
                    strengths: "3 à 5 puces sur les forces internes du projet.",
                    weaknesses: "3 à 5 puces sur les faiblesses à gérer.",
                    opportunities: "3 à 5 puces sur les opportunités marché.",
                    threats: "3 à 5 puces sur les menaces externes."
                };

                const specificInstruction = sectionGuidance[id] || "Information essentielle uniquement.";

                if (isFFOMSection) {
                    systemInst = `${ANETI_SYSTEM_PROMPT}\n\nSection FFOM : ${label}. FORMAT SPÉCIAL : Répondre sous forme de liste à puces (3-5 éléments). Chaque puce = une idée courte et factuelle. Pas de texte avant ou après la liste.`;
                    fullPrompt = [
                        globalContext ? `CONTEXTE : ${globalContext.split('\n')[0]} | Secteur: ${globalContext.split('\n')[2] || 'N/A'}` : '',
                        `SECTION FFOM : ${label}`,
                        promptContext ? `INFO : ${promptContext.substring(0, 150)}` : '',
                        value ? `BASE : "${value.substring(0, 200)}${value.length > 200 ? '...' : ''}"` : '',
                        ``,
                        `→ Liste à puces (tirés) :`
                    ].filter(Boolean).join('\n');
                } else {
                    systemInst = `${ANETI_SYSTEM_PROMPT}\n\nSection : ${label}. Contrainte : ${specificInstruction}`;

                    // Prompts spécifiques selon la section pour garantir des contenus différents
                    if (id === 'conclusion') {
                        // Conclusion : focus sur la vision du projet (pas de chiffres détaillés)
                        fullPrompt = [
                            globalContext ? `PROJET : ${globalContext.split('\n')[0]} | Mission: ${globalContext.split('\n')[3] || 'N/A'}` : '',
                            `SECTION : ${label}`,
                            promptContext ? `ANGLE : ${promptContext.substring(0, 150)}` : '',
                            value ? `ÉLÉMENTS CLÉS À SOULIGNER : "${value.substring(0, 200)}"` : '',
                            ``,
                            `→ Rédige une conclusion engageante présentant les forces du projet (sans citer de chiffres financiers bruts) :`
                        ].filter(Boolean).join('\n');
                    } else if (id === 'editorAdvice') {
                        // Avis du rédacteur : focus sur l'analyse financière et l'évaluation
                        fullPrompt = [
                            globalContext ? `DONNÉES FINANCIÈRES : ${globalContext.split('\n')[5] || ''} | ${globalContext.split('\n')[6] || ''}` : '',
                            `SECTION : ${label}`,
                            promptContext ? `RÔLE : ${promptContext.substring(0, 150)}` : '',
                            value ? `POINTS DE RÉFLEXION : "${value.substring(0, 200)}"` : '',
                            ``,
                            `→ Rédige un avis professionnel ANETI évaluant le projet avec chiffres à l'appui et donnant une recommandation claire sur le financement :`
                        ].filter(Boolean).join('\n');
                    } else {
                        // Autres sections : prompt standard
                        fullPrompt = [
                            globalContext ? `CONTEXTE : ${globalContext.split('\n')[0]} | CA:${globalContext.match(/CA An1: ([^|]+)/)?.[1] || 'N/A'} | Marge:${globalContext.match(/Marge nette moyenne: ([^%]+)/)?.[1] || 'N/A'}%` : '',
                            `SECTION : ${label}`,
                            promptContext ? `INFO : ${promptContext.substring(0, 150)}` : '',
                            value ? `BASE : "${value.substring(0, 200)}${value.length > 200 ? '...' : ''}"` : '',
                            ``,
                            `→ Paragraphe :`
                        ].filter(Boolean).join('\n');
                    }
                }
            }

            // Conclusion et Avis du rédacteur autorisés à être plus longs
            const isLongSection = id === 'conclusion' || id === 'editorAdvice';

            const generated = await aiManager.generateSection(fullPrompt, {
                maxTokens: isLongSection ? 450 : 280, // Plus long pour conclusion et avis rédacteur
                temperature: 0.55, // Plus déterministe pour des réponses directes
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

    useEffect(() => {
        if (isProposalOpen) {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
    }, [isProposalOpen]);

    return (
        <div className="space-y-2 relative group">
            <Dialog open={isProposalOpen} onOpenChange={setIsProposalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-2xl">
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
                            (value && value.length > 0 ? 'Suggestion AI' : 'Générer avec IA')}
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
