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
    isDemoMode?: boolean;
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
    businessPlanData,
    isDemoMode = false
}: SectionGeneratorProps) {
    const [status, setStatus] = useState<'idle' | 'loading-model' | 'generating'>('idle');
    const [progress, setProgress] = useState(0);
    const [proposal, setProposal] = useState<string | null>(null);
    const [isProposalOpen, setIsProposalOpen] = useState(false);

    const handleGenerate = async () => {
        setStatus('loading-model');
        setProgress(0);

        try {
            await aiManager.init((data: Record<string, unknown>) => {
                if (data.status === 'progress' && typeof data.file === 'string' && data.file.endsWith('.onnx')) {
                    setProgress(Math.round(Number(data.progress) || 0));
                }
            });

            setStatus('generating');

            // ══════════════════════════════════════════════════════════════
            // STRICT SCOPING — Classification des sections par phase
            // Chaque section n'accède qu'aux données de son périmètre.
            // ══════════════════════════════════════════════════════════════

            // Phase 1 — Identité promoteur (sections 1-2)
            const PHASE_IDENTITY = ['qualifications', 'experience'];
            // Phase 2 — Descriptif projet (section 3)
            const PHASE_PROJECT = ['projectDescription', 'projectAdvantages', 'projectAuthorizations'];
            // Phase 3 — Financement (sections 4-5-6) : montants déclarés uniquement, pas de ratios calculés
            const PHASE_FINANCING = ['loanPurpose', 'loanJustification', 'guaranteesDetails', 'investmentBreakdown', 'btsCreditDetails', 'bankCreditDetails'];
            // Phase 4 — Marché & exploitation (section 7) : profil activité + identité, pas de ratios
            const PHASE_MARKET = ['marketStudy', 'marketingStrategy', 'manufacturingProcess', 'productsDescription', 'targetAudience', 'locationDescription', 'salesBreakdown', 'purchasingBreakdown', 'suppliers'];
            // Phase 5 — Rentabilité (section 8) : SEULE phase autorisée à utiliser VAN/TRI/CA/marges
            const PHASE_PROFITABILITY = ['profitabilityAnalysis'];
            // Phase 6 — Synthèse (sections 9-10) : tous les indicateurs disponibles
            const PHASE_SYNTHESIS = ['strengths', 'weaknesses', 'opportunities', 'threats', 'conclusion', 'editorAdvice'];

            const inPhase = (phases: string[][]) => phases.some(p => p.includes(id));
            const isFinancialPhase = inPhase([PHASE_PROFITABILITY, PHASE_SYNTHESIS]);
            const isFinancingPhase = inPhase([PHASE_FINANCING]);
            const isMarketPhase = inPhase([PHASE_MARKET]);

            // ── Formatter NON-AMBIGU pour le contexte AI ──────────────────
            // IMPORTANT: on n'utilise PAS Intl.NumberFormat ici car les LLM
            // confondent le séparateur de milliers (espace / virgule) avec
            // un séparateur décimal → "45 000 TND" lu comme "45 millions".
            // On passe un entier brut + l'unité explicite en toutes lettres.
            const fmtN = (n?: number): string | null => {
                if (n === undefined || n === null || isNaN(n) || n === 0) return null;
                const rounded = Math.round(n);
                // Libellé verbal de l'ordre de grandeur pour guidance IA
                let label = "";
                if (Math.abs(rounded) >= 1_000_000) {
                    label = ` (${(rounded / 1_000_000).toFixed(3).replace('.', ',')} million TND)`;
                } else if (Math.abs(rounded) >= 1_000) {
                    label = ` (${(rounded / 1_000).toFixed(3).replace('.', ',')} mille TND)`;
                }
                return `${rounded} TND${label}`;
            };

            // ── Identity (toujours disponible) ────────────────────────────
            const projectName = businessPlanData?.companyName || businessPlanData?.projectTitle || "Non défini";
            const sector = businessPlanData?.industry || businessPlanData?.projectSector || "Non défini";
            const location = businessPlanData?.projectLocation || "";
            const legalForm = businessPlanData?.legalStructure || "";
            const promoterName = businessPlanData?.promoterName || "le promoteur";
            const experienceYears = businessPlanData?.experienceYears || 0;
            const mission = businessPlanData?.missionStatement || businessPlanData?.projectDescription?.substring(0, 120) || "";

            const identityLine = [
                `Projet: ${projectName}`,
                `Secteur: ${sector}`,
                location ? `Lieu: ${location}` : "",
                legalForm ? `Forme: ${legalForm}` : "",
            ].filter(Boolean).join(" | ");

            // ── Montants déclarés (phases financement+) ───────────────────
            const declaredFinancing = (isFinancingPhase || isFinancialPhase) ? [
                businessPlanData?.investmentCost ? `Investissement total: ${fmtN(businessPlanData.investmentCost)}` : "",
                businessPlanData?.personalContribution ? `Apport personnel: ${fmtN(businessPlanData.personalContribution)}` : "",
                businessPlanData?.loanAmount ? `Crédit demandé: ${fmtN(businessPlanData.loanAmount)} sur ${businessPlanData.loanDuration}m à ${businessPlanData.loanInterestRate}%` : "",
            ].filter(Boolean).join(" | ") : "";

            // ── Profil activité (phases marché+) ──────────────────────────
            let activityBlock = "";
            let analysisObj: ReturnType<typeof generateAnalysis> | null = null;
            if (isMarketPhase || isFinancialPhase) {
                try {
                    analysisObj = generateAnalysis(businessPlanData!);
                    if (analysisObj) {
                        activityBlock = [
                            `Activité: ${analysisObj.profile.activity_type}`,
                            `Revenus: ${analysisObj.profile.revenue_model}`,
                            `Canal: ${analysisObj.profile.sales_channel}`,
                            `Client: ${analysisObj.profile.customer_type.join("/")}`,
                            `Digital: ${analysisObj.attributes.digital ? "oui" : "non"}`,
                            `Risques: ${analysisObj.risks.join(", ")}`,
                        ].join(" | ");
                    }
                } catch (_) { activityBlock = ""; }
            }

            // ── Ratios financiers calculés (UNIQUEMENT phases 5-6) ────────
            let finBlock = "";
            if (isFinancialPhase) {
                try {
                    const results = calculateOperatingResults(businessPlanData!);
                    const fp = calculateFinancialPlan(businessPlanData!);
                    const s = results.summary;
                    const firstIdx = businessPlanData?.includeYearZero ? 1 : 0;
                    const opYears = results.years.slice(firstIdx);
                    const y1 = opYears[0];
                    const avgNetMargin = opYears.length
                        ? opYears.reduce((a, y) => a + (y.turnover > 0 ? (y.netResult / y.turnover) * 100 : 0), 0) / opYears.length
                        : 0;
                    finBlock = [
                        y1?.turnover ? `CA An1: ${fmtN(y1.turnover)}` : "",
                        s.cruiseYearData?.turnover ? `CA Croisière (An${businessPlanData?.cruiseYear}): ${fmtN(s.cruiseYearData.turnover)}` : "",
                        s.cruiseYearData?.netResult ? `Résultat net croisière: ${fmtN(s.cruiseYearData.netResult)}` : "",
                        avgNetMargin > 0 ? `Marge nette moy.: ${avgNetMargin.toFixed(1)}%` : "",
                        s.van ? `VAN: ${fmtN(s.van)}` : "",
                        s.roi ? `TRI: ${s.roi.toFixed(1)}%` : "",
                        s.payback ? `Payback: ${s.payback.years}a ${s.payback.months}m` : "",
                        Math.abs(fp.gap) < 1 ? "Plan: ÉQUILIBRÉ ✓" : `Plan: DÉSÉQUILIBRÉ (écart ${fmtN(fp.gap)})`,
                    ].filter(Boolean).join(" | ");
                } catch (_) { finBlock = ""; }
            }

            // ── Contexte assemblé selon la phase ──────────────────────────
            const ctx = [
                identityLine,
                mission && !inPhase([PHASE_IDENTITY]) ? `Mission: ${mission}` : "",
                !inPhase([PHASE_IDENTITY]) ? `Promoteur: ${promoterName} — ${experienceYears} an(s) d'expérience` : `Promoteur: ${promoterName}`,
                declaredFinancing ? `Montage financier: ${declaredFinancing}` : "",
                activityBlock ? `Profil activité: ${activityBlock}` : "",
                finBlock ? `Indicateurs financiers calculés: ${finBlock}` : "",
            ].filter(Boolean).join("\n");

            // ── Règle anti-hallucination ajoutée au SYSTEM selon la phase ─
            const scopeRule = isFinancialPhase
                ? "PÉRIMÈTRE : Tu disposes des indicateurs financiers calculés. Utilise-les factuellement."
                : isFinancingPhase
                    ? "PÉRIMÈTRE STRICT : Tu ne disposes que des montants déclarés par l'utilisateur. INTERDIT d'évoquer VAN, TRI, marge nette, seuil de rentabilité ou tout ratio calculé — ces données n'existent pas encore à ce stade."
                    : isMarketPhase
                        ? "PÉRIMÈTRE STRICT : Tu te limites à l'analyse marché, commerciale et opérationnelle. INTERDIT d'évoquer VAN, TRI, CA prévisionnel, marge nette ou tout ratio de rentabilité calculé — la section Rentabilité n'a pas encore été saisie."
                        : "PÉRIMÈTRE STRICT : Tu te limites à la description du projet et du promoteur. INTERDIT d'évoquer des chiffres de rentabilité, des projections financières ou des ratios — ces données n'existent pas à ce stade.";

            // ── System Prompt de base ──────────────────────────────────────
            const SYSTEM = `Tu es un Expert Financier senior qui rédige des Business Plans professionnels pour l'ANETI (Tunisie). LANGUE : Français uniquement, jamais d'anglais.

RÈGLES ABSOLUES :
1. Commence directement par le contenu — jamais "Voici", "Bien sûr", "En résumé".
2. Style télégraphique : verbes d'action, chiffres concrets, zéro adjectif superflu.
3. Basé UNIQUEMENT sur les données fournies dans le contexte. Ne jamais inventer ni estimer de chiffres absents.
4. Cohérence absolue avec le projet décrit (secteur, montants, promoteur).
5. CRITIQUE — ÉCHELLE MONNÉTAIRE : Les montants du contexte sont en Dinars Tunisiens (TND). Le format est [entier] TND suivi d'un libellé indicatif entre parenthèses. Exemples : «45000 TND (45,000 mille TND)» = quarante-cinq mille dinars ; «1200000 TND (1,200 million TND)» = un million deux cent mille dinars. NE JAMAIS confondre l'ordre de grandeur. Avant d'écrire un montant en lettres, vérifie son ordre de grandeur : < 1000 = centaines, < 1 000 000 = milliers, ≥ 1 000 000 = millions.
6. ${scopeRule}`.trim();

            const isFFOM = ['strengths', 'weaknesses', 'opportunities', 'threats'].includes(id);
            // In demo mode, never reformulate existing demo text
            const isReformulation = !isDemoMode && value && value.length > 10;

            // ── Section-specific instructions ─────────────────────────────
            const sectionConfig: Record<string, {
                system: string;
                userPrompt: (ctx: string, val: string) => string;
                maxTok: number;
                temp: number;
            }> = {
                projectDescription: {
                    system: `${SYSTEM}\n\nSection: Description de l'activité. FORMAT: 1 paragraphe de 4-6 phrases. Décris le concept, la valeur ajoutée, le modèle économique et la cible client. Chiffres si disponibles.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule et enrichis:` : "Rédige la description de l'activité:"} `,
                    maxTok: 320, temp: 0.5,
                },
                qualifications: {
                    system: `${SYSTEM}\n\nSection: Qualifications du promoteur. FORMAT: 1 paragraphe de 3-4 phrases. Diplômes, certifications, compétences clés en lien direct avec l'activité.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Rédige les qualifications du promoteur:"} `,
                    maxTok: 280, temp: 0.45,
                },
                experience: {
                    system: `${SYSTEM}\n\nSection: Expérience professionnelle. FORMAT: 1 paragraphe de 3-4 phrases. Postes occupés, durées, responsabilités pertinentes par rapport au projet.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Rédige le parcours professionnel:"}`,
                    maxTok: 280, temp: 0.45,
                },
                loanPurpose: {
                    system: `${SYSTEM}\n\nSection: Objet du crédit. FORMAT: 2-3 phrases. Montant exact demandé, destination précise des fonds (équipements, BFR, travaux), lien avec le plan d'investissement.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 300)}"\n\nReformule:` : "Rédige l'objet du crédit:"}`,
                    maxTok: 220, temp: 0.4,
                },
                loanJustification: {
                    system: `${SYSTEM}\n\nSection: Justification du crédit. FORMAT: 3-4 phrases. Pourquoi ce montant est nécessaire, taux d'apport personnel, capacité de remboursement (CAF vs service de la dette), garanties disponibles.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Justifie le crédit demandé avec chiffres:"}`,
                    maxTok: 280, temp: 0.4,
                },
                guaranteesDetails: {
                    system: `${SYSTEM}\n\nSection: Garanties. FORMAT: 2-3 phrases. Nature des garanties (SOTUGAR, caution personnelle, hypothèque), montants, couverture en % du crédit.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 300)}"\n\nReformule:` : "Décris les garanties proposées:"}`,
                    maxTok: 200, temp: 0.4,
                },
                investmentBreakdown: {
                    system: `${SYSTEM}\n\nSection: Répartition de l'investissement. FORMAT: 2-3 phrases. Total TTC, détail emplois (équipements/BFR/frais), répartition ressources (apport %/crédit %).`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 300)}"\n\nReformule:` : "Décris la structure du plan de financement:"}`,
                    maxTok: 220, temp: 0.4,
                },
                marketStudy: {
                    system: `${SYSTEM}\n\nSection: Étude de marché. FORMAT: 1 paragraphe de 5-6 phrases. Taille/tendance du marché local, demande cible, concurrents principaux, positionnement différenciant, chiffres de marché si disponibles.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 500)}"\n\nReformule et enrichis:` : "Rédige l'analyse de marché:"}`,
                    maxTok: 380, temp: 0.55,
                },
                marketingStrategy: {
                    system: `${SYSTEM}\n\nSection: Stratégie commerciale & marketing. FORMAT: 1 paragraphe de 4-5 phrases. Canaux d'acquisition, actions concrètes, budget indicatif, cible prioritaire, différenciateurs.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 500)}"\n\nReformule:` : "Rédige la stratégie marketing:"}`,
                    maxTok: 320, temp: 0.55,
                },
                // ── 7P Marketing Mix — 1 config per P ──────────────────────
                marketingP1_product: {
                    system: `${SYSTEM}\n\nSection: 7P Marketing Mix — P1 PRODUIT. FORMAT: 2-3 phrases. Décris l'offre (produit/service), ses caractéristiques distinctives, sa gamme, son positionnement qualité et son avantage concurrentiel.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris le produit/service (P1):"}`,
                    maxTok: 200, temp: 0.5,
                },
                marketingP2_price: {
                    system: `${SYSTEM}\n\nSection: 7P Marketing Mix — P2 PRIX. FORMAT: 2-3 phrases. Politique tarifaire, positionnement prix vs concurrence, éventuelles remises ou offres d'entrée, conditions et délais de paiement.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris la politique de prix (P2):"}`,
                    maxTok: 180, temp: 0.45,
                },
                marketingP3_place: {
                    system: `${SYSTEM}\n\nSection: 7P Marketing Mix — P3 DISTRIBUTION. FORMAT: 2-3 phrases. Canaux de vente (direct/indirect, physique/digital), zone géographique couverte, logistique de livraison.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris la distribution (P3):"}`,
                    maxTok: 180, temp: 0.5,
                },
                marketingP4_promotion: {
                    system: `${SYSTEM}\n\nSection: 7P Marketing Mix — P4 COMMUNICATION. FORMAT: 2-3 phrases. Actions marketing concrètes (réseaux sociaux, affichage, bouche-à-oreille, partenariats), budget indicatif si disponible.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris la stratégie de communication (P4):"}`,
                    maxTok: 200, temp: 0.55,
                },
                marketingP5_people: {
                    system: `${SYSTEM}\n\nSection: 7P Marketing Mix — P5 PERSONNEL. FORMAT: 2-3 phrases. Compétences clés des équipes en contact client, formation prévue, culture de service, relation client.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris le facteur humain (P5):"}`,
                    maxTok: 180, temp: 0.5,
                },
                marketingP6_process: {
                    system: `${SYSTEM}\n\nSection: 7P Marketing Mix — P6 PROCESSUS. FORMAT: 2-3 phrases. Parcours client de A à Z, procédures de commande/livraison/SAV, outils de gestion utilisés.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris les processus (P6):"}`,
                    maxTok: 180, temp: 0.5,
                },
                marketingP7_physicalEvidence: {
                    system: `${SYSTEM}\n\nSection: 7P Marketing Mix — P7 PREUVE PHYSIQUE. FORMAT: 2-3 phrases. Aménagement du local/espace de vente, signalétique, supports imprimés, site web, image de marque tangible.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris les preuves physiques (P7):"}`,
                    maxTok: 180, temp: 0.5,
                },
                manufacturingProcess: {
                    system: `${SYSTEM}\n\nSection: Plan opérationnel / Processus de production. FORMAT: 1 paragraphe de 4-5 phrases. Étapes clés du processus, ressources humaines et matérielles, délais, organisation.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 500)}"\n\nReformule:` : "Décris le processus opérationnel:"}`,
                    maxTok: 320, temp: 0.5,
                },
                productsDescription: {
                    system: `${SYSTEM}\n\nSection: Description des produits/services. FORMAT: 1 paragraphe de 4-5 phrases. Lignes de produits/services, prix indicatifs, valeur ajoutée pour le client, différenciation.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 500)}"\n\nReformule:` : "Décris les produits/services proposés:"}`,
                    maxTok: 320, temp: 0.5,
                },
                targetAudience: {
                    system: `${SYSTEM}\n\nSection: Clientèle cible. FORMAT: 3-4 phrases. Profil précis (âge, secteur, comportement), taille du segment, pouvoir d'achat, motivation d'achat.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris la cible clientèle:"}`,
                    maxTok: 260, temp: 0.5,
                },
                locationDescription: {
                    system: `${SYSTEM}\n\nSection: Localisation & implantation. FORMAT: 3-4 phrases. Adresse/zone, avantages stratégiques (accessibilité, zone de chalandise, visibilité), superficie, mode d'occupation.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris la localisation du projet:"}`,
                    maxTok: 260, temp: 0.45,
                },
                salesBreakdown: {
                    system: `${SYSTEM}\n\nSection: Répartition du chiffre d'affaires. FORMAT: 2-3 phrases. Part de chaque ligne de produit/service dans le CA prévisionnel, avec pourcentages.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris la répartition du CA par produit/service:"}`,
                    maxTok: 220, temp: 0.4,
                },
                purchasingBreakdown: {
                    system: `${SYSTEM}\n\nSection: Structure des achats. FORMAT: 2-3 phrases. Principales catégories de coûts d'achat/approvisionnement avec pourcentages, fournisseurs stratégiques.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris la structure des achats:"}`,
                    maxTok: 220, temp: 0.4,
                },
                suppliers: {
                    system: `${SYSTEM}\n\nSection: Fournisseurs. FORMAT: 2-3 phrases. Principaux fournisseurs, produits/services fournis, relations contractuelles, risque de dépendance.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : "Décris les fournisseurs principaux:"}`,
                    maxTok: 220, temp: 0.4,
                },
                profitabilityAnalysis: {
                    system: `${SYSTEM}\n\nSection: Analyse de rentabilité. FORMAT: 1 paragraphe de 4-5 phrases. Seuil de rentabilité (% du CA), marge nette, VAN/TRI/payback, conclusion sur la viabilité. Utilise les chiffres fournis.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 500)}"\n\nReformule avec les chiffres du contexte:` : "Rédige l'analyse de rentabilité en utilisant les indicateurs financiers fournis:"}`,
                    maxTok: 360, temp: 0.4,
                },
                strengths: {
                    system: `${SYSTEM}\n\nSection FFOM — Forces. FORMAT IMPÉRATIF: liste de 4-5 tirets (–). Chaque tiret = 1 force interne concrète du projet. Pas de texte avant/après la liste.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BASE:\n"${v.substring(0, 400)}"\n\nReformule en 4-5 puces:` : "Liste les forces internes du projet (4-5 puces):"}`,
                    maxTok: 250, temp: 0.5,
                },
                weaknesses: {
                    system: `${SYSTEM}\n\nSection FFOM — Faiblesses. FORMAT IMPÉRATIF: liste de 4-5 tirets (–). Chaque tiret = 1 faiblesse interne réelle. Pas de texte avant/après.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BASE:\n"${v.substring(0, 400)}"\n\nReformule en 4-5 puces:` : "Liste les faiblesses internes du projet (4-5 puces):"}`,
                    maxTok: 250, temp: 0.5,
                },
                opportunities: {
                    system: `${SYSTEM}\n\nSection FFOM — Opportunités. FORMAT IMPÉRATIF: liste de 4-5 tirets (–). Chaque tiret = 1 opportunité externe de marché. Pas de texte avant/après.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BASE:\n"${v.substring(0, 400)}"\n\nReformule en 4-5 puces:` : "Liste les opportunités marché externes (4-5 puces):"}`,
                    maxTok: 250, temp: 0.5,
                },
                threats: {
                    system: `${SYSTEM}\n\nSection FFOM — Menaces. FORMAT IMPÉRATIF: liste de 4-5 tirets (–). Chaque tiret = 1 menace externe concrète. Pas de texte avant/après.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BASE:\n"${v.substring(0, 400)}"\n\nReformule en 4-5 puces:` : "Liste les menaces externes du projet (4-5 puces):"}`,
                    maxTok: 250, temp: 0.5,
                },
                conclusion: {
                    system: `${SYSTEM}\n\nSection: Conclusion du business plan. POINT DE VUE: porteur du projet (1ère personne du pluriel "nous" ou neutre). FORMAT: 1 paragraphe engageant de 5-6 phrases. Synthèse des atouts, potentiel de marché, viabilité, appel à financement. NE PAS citer de ratios bruts (VAN/TRI) — évoquer la rentabilité en termes qualitatifs.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 500)}"\n\nReformule et enrichis:` : "Rédige la conclusion du business plan:"}`,
                    maxTok: 420, temp: 0.6,
                },
                editorAdvice: {
                    system: `${SYSTEM}\n\nSection: Avis du conseiller ANETI. POINT DE VUE: agent externe objectif (3ème personne). FORMAT: 1 paragraphe factuel de 5-6 phrases. Évalue la cohérence financière (marge, seuil de rentabilité, couverture dette), le profil du promoteur, et donne une recommandation EXPLICITE: "Favorable", "Favorable sous réserves" ou "Défavorable" en justifiant avec les chiffres disponibles.`,
                    userPrompt: (c, v) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 500)}"\n\nReformule avec les données financières fournies:` : "Rédige l'avis du conseiller ANETI avec chiffres et recommandation claire:"}`,
                    maxTok: 450, temp: 0.4,
                },
            };

            // Generic fallback config
            const defaultConfig = {
                system: `${SYSTEM}\n\nSection: ${label}. FORMAT: 1 paragraphe de 3-4 phrases factuelles et directes.`,
                userPrompt: (c: string, v: string) => `${c}\n\n${v ? `BROUILLON:\n"${v.substring(0, 400)}"\n\nReformule:` : `Rédige le contenu pour "${label}":`}`,
                maxTok: 280, temp: 0.5,
            };

            const cfg = sectionConfig[id] || defaultConfig;

            // For FFOM reformulation, always use the FFOM config (don't switch to generic)
            const sourceValue = isReformulation ? value : "";

            const systemInst = cfg.system;
            const fullPrompt = cfg.userPrompt(ctx, sourceValue);
            const maxTokens = cfg.maxTok;
            const temperature = isReformulation ? Math.max(cfg.temp - 0.1, 0.3) : cfg.temp;

            const generated = await aiManager.generateSection(fullPrompt, {
                maxTokens,
                temperature,
                systemInstruction: systemInst,
            });

            if (generated) {
                setProposal(generated.trim());
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
                            Suggestion basée sur les données de votre projet. Adoptez ou ignorez.
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
                    {status === 'loading-model' ? `Chargement ${progress > 0 ? `${progress}%` : ''}` :
                        status === 'generating' ? 'Rédaction...' :
                            (value && value.length > 0 ? 'Améliorer avec IA' : 'Générer avec IA')}
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
