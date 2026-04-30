import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { aiManager } from "@/lib/ai/manager";
import { toast } from "sonner";
import { BusinessPlanData } from "@/types/businessPlan";
import { calculateOperatingResults, calculateFinancialPlan, calculateInvestment } from "@/utils/financialCalculations";
import { BarChart2, BrainCircuit, Loader2, X, AlertTriangle, CheckCircle2, TrendingUp, Star, Download, Info } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { generateAnalysis } from "@/utils/businessAnalysis";

interface AuditDialogProps {
    businessPlanData: BusinessPlanData;
    reportContent?: string | null;
    onReportGenerated?: (report: string) => void;
}

interface AuditGuards {
    forcedGlobalCap: number | null;
    forcedTechnicalCap: number | null;
    hardRejection: boolean;
    sourceErrors: string[];
    sourceWarnings: string[];
    numericAdjustments: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateDeterministicAuditReport(data: BusinessPlanData) {
    const fmtCurrency = (n?: number) =>
        n !== undefined
            ? new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(n)
            : "N/A";

    const pct = (n?: number) => (n !== undefined && Number.isFinite(n) ? `${n.toFixed(1)}%` : "N/A");

    const results = calculateOperatingResults(data);
    const inv = calculateInvestment(data.equipments || []);
    const fp = calculateFinancialPlan(data);
    const s = results.summary;
    const firstOperatingIndex = data.includeYearZero ? 1 : 0;
    const operatingYears = results.years.slice(firstOperatingIndex);
    const y1 = operatingYears[0];
    const yN = operatingYears[operatingYears.length - 1];

    const totalInvestment = inv.totalTTC + (data.startupCosts || 0) + (data.workingCapital || 0);
    const van = s.van;
    const tri = s.roi;

    const planFinEquilibre = Math.abs(fp.gap) < 1;

    // Point mort / Seuil de rentabilité doit être analysé PAR ANNÉE (tendance),
    // pas via le seul point mort d'année de croisière.
    const personnelIsVariable = data.personnelCostMode === 'percentage' && data.personnelCostPercentage != null;
    const breakEvenRatios = operatingYears.map((y) => {
        const turnover = y.turnover;
        if (!turnover || turnover <= 0) return { ratio: Infinity, bep: Infinity };
        const fixed = y.totalExpenses - y.materialsCost + y.totalTaxes - y.corporateTax;
        const variable = y.materialsCost + (personnelIsVariable ? y.personnelCost : 0);
        const contributionMargin = turnover - variable;
        const bep = contributionMargin > 0 ? (fixed * turnover) / contributionMargin : Infinity;
        const ratio = bep / turnover * 100;
        return { ratio, bep };
    });
    const breakEvenRatioY1 = breakEvenRatios[0]?.ratio ?? Infinity;
    const breakEvenRatioMax = breakEvenRatios.length ? Math.max(...breakEvenRatios.map(r => r.ratio)) : Infinity;
    const breakEvenRatioMin = breakEvenRatios.length ? Math.min(...breakEvenRatios.map(r => r.ratio)) : Infinity;
    const firstYearBelow75 = breakEvenRatios.findIndex(r => r.ratio <= 75);

    const netMarginCruise = s.cruiseYearData.turnover > 0 ? (s.cruiseYearData.netResult / s.cruiseYearData.turnover) * 100 : 0;
    const avgNetMargin = operatingYears.length
        ? (operatingYears.reduce((acc, y) => acc + (y.turnover > 0 ? (y.netResult / y.turnover) * 100 : 0), 0) / operatingYears.length)
        : 0;

    const cafCruise = s.cruiseYearData.netResult + s.cruiseYearData.amortization;
    const annualLoanYears = Math.max((data.loanDuration || 60) / 12, 1);
    const annualDebtService = s.cruiseYearData.financialCharges + (data.loanAmount || 0) / annualLoanYears;
    const debtCoverage = annualDebtService > 0 ? cafCruise / annualDebtService : null;

    const apportRatio = totalInvestment > 0 ? ((data.personalContribution || 0) / totalInvestment) * 100 : 0;

    const dataErrors: string[] = [];
    const dataWarnings: string[] = [];

    const structuredAnalysis = generateAnalysis(data);

    if (!data.projectTitle) dataWarnings.push("ATTENTION : Titre du projet non renseigné.");
    if (!data.personalContribution || data.personalContribution <= 0) dataErrors.push("ERREUR : Apport personnel non renseigné — rejet.");
    if (!planFinEquilibre) dataErrors.push(`ERREUR : Plan de financement déséquilibré (écart = ${fmtCurrency(fp.gap)}) — rejet.`);
    if (!operatingYears.length) dataErrors.push("ERREUR : Aucune année d'exploitation calculable.");

    if (tri <= (data.discountRate || 10)) dataErrors.push(`ERREUR CRITIQUE : TRI (${pct(tri)}) ≤ taux d'actualisation (${data.discountRate || 10}%).`);
    if (van < 0) dataErrors.push(`ERREUR : VAN négative (${fmtCurrency(van)}).`);
    if (totalInvestment > 0 && van > totalInvestment * 5) dataErrors.push(`ERREUR DE CALCUL : VAN (${fmtCurrency(van)}) > 5x capital investi (${fmtCurrency(totalInvestment)}).`);
    if (breakEvenRatioY1 > 75) {
        // Ce n'est pas forcément un rejet si l'amélioration est rapide; on signale l'alerte de tension An1.
        dataWarnings.push(`ATTENTION : Seuil de rentabilité élevé en An1 (${breakEvenRatioY1.toFixed(1)}% du CA). À analyser sur la tendance An1→AnN.`);
    }

    if (!data.hasGuarantees) dataWarnings.push("ATTENTION : Garanties non renseignées.");

    const overvaluation = totalInvestment > 0 && van > totalInvestment * 5;
    const tooHighTRI = tri > 200; // heuristique incohérence
    const strategy = overvaluation || tooHighTRI ? "RÉDUIRE_HYPOTHÈSES" : "RENFORCER_HYPOTHÈSES";

    // --- Modèle économique: structure coûts & sensibilité CA (sur toute la période) ---
    const fixedRatios = operatingYears.map((y) => {
        if (!y.turnover || y.turnover <= 0) return Infinity;
        const fixed = y.totalExpenses - y.materialsCost + y.totalTaxes - y.corporateTax;
        return (fixed / y.turnover) * 100;
    });
    const variableRatios = operatingYears.map((y) => {
        if (!y.turnover || y.turnover <= 0) return 0;
        return (y.materialsCost / y.turnover) * 100;
    });
    const avgFixedRatio = fixedRatios.length ? fixedRatios.reduce((a, b) => a + b, 0) / fixedRatios.length : Infinity;
    const avgVariableRatio = variableRatios.length ? variableRatios.reduce((a, b) => a + b, 0) / variableRatios.length : 0;

    const modelRigidity =
        avgFixedRatio >= 40 && avgVariableRatio <= 20 ? "rigide" :
        avgFixedRatio >= 30 ? "plutôt rigide" :
        avgVariableRatio >= 50 ? "variable-dominant" :
        "mixte";

    // --- Attributs stratégiques ---
    // (secteur/modèle/attributs) proviennent désormais UNIQUEMENT des champs structurés (déterministes).

    // --- Qualification du risque (graduée) ---
    const riskSignals: Array<{ label: string; level: "✅ Faible risque" | "⚠️ Risque modéré" | "❌ Risque élevé"; why: string }> = [];
    // Seuil de rentabilité (tendance)
    if (breakEvenRatioMax <= 75) {
        riskSignals.push({ label: "Seuil de rentabilité", level: "✅ Faible risque", why: "Le ratio reste ≤ 75% sur toute la période (marge de sécurité acceptable)." });
    } else if (firstYearBelow75 >= 0) {
        riskSignals.push({ label: "Seuil de rentabilité", level: "⚠️ Risque modéré", why: `Tension en An1, mais amélioration: ratio ≤ 75% à partir de An ${firstYearBelow75 + 1}.` });
    } else {
        riskSignals.push({ label: "Seuil de rentabilité", level: "❌ Risque élevé", why: "Ratio > 75% sur toute la période: faible marge de sécurité, vulnérabilité aux baisses d’activité." });
    }
    // Marge nette
    if (avgNetMargin >= 20) riskSignals.push({ label: "Marge nette", level: "✅ Faible risque", why: `Marge nette moyenne période = ${avgNetMargin.toFixed(1)}%.` });
    else if (avgNetMargin >= 10) riskSignals.push({ label: "Marge nette", level: "⚠️ Risque modéré", why: `Marge nette moyenne période = ${avgNetMargin.toFixed(1)}% (sensibilité aux coûts/prix).` });
    else riskSignals.push({ label: "Marge nette", level: "❌ Risque élevé", why: `Marge nette moyenne période = ${avgNetMargin.toFixed(1)}% (insuffisante).` });
    // Couverture dette
    if (debtCoverage === null) riskSignals.push({ label: "Dette", level: "✅ Faible risque", why: "Pas de dette déclarée." });
    else if (debtCoverage >= 1.5) riskSignals.push({ label: "Dette", level: "✅ Faible risque", why: `Couverture dette = ${debtCoverage.toFixed(2)}.` });
    else if (debtCoverage >= 1.2) riskSignals.push({ label: "Dette", level: "⚠️ Risque modéré", why: `Couverture dette = ${debtCoverage.toFixed(2)} (proche du minimum).` });
    else riskSignals.push({ label: "Dette", level: "❌ Risque élevé", why: `Couverture dette = ${debtCoverage.toFixed(2)} (< 1.2).` });
    // Structure des coûts — évaluation contextualisée par secteur
    // Pour les secteurs Services, Digital, Startup, Freelance : un ratio de charges fixes élevé
    // est STRUCTURELLEMENT NORMAL (personnel qualifié + SaaS + loyer). Ce n'est pas un risque élevé.
    // Le ❌ Risque élevé est réservé aux secteurs à fort CAPEX (Industrie, Commerce) où la rigidité
    // représente un vrai risque opérationnel en cas de baisse de volume.
    const isLowCapexSector = structuredAnalysis
        ? ["Services", "Freelance", "Startup"].includes(structuredAnalysis.sector) || structuredAnalysis.attributes.digital
        : false;

    if (modelRigidity === "rigide") {
        if (isLowCapexSector) {
            // Rigidité normale pour ce type d'activité → risque modéré seulement
            riskSignals.push({
                label: "Structure des coûts",
                level: "⚠️ Risque modéré",
                why: `Charges fixes élevées (~${avgFixedRatio.toFixed(1)}% du CA) typiques d'une activité de service/digitale. Risque de levier opérationnel en cas de baisse d'activité — à surveiller.`
            });
        } else {
            riskSignals.push({
                label: "Structure des coûts",
                level: "❌ Risque élevé",
                why: `Charges fixes élevées (~${avgFixedRatio.toFixed(1)}% du CA) et coûts variables faibles (~${avgVariableRatio.toFixed(1)}%) dans un secteur à fort CAPEX : sensibilité élevée au volume.`
            });
        }
    } else if (modelRigidity === "plutôt rigide") {
        riskSignals.push({ label: "Structure des coûts", level: "⚠️ Risque modéré", why: `Charges fixes significatives (~${avgFixedRatio.toFixed(1)}% du CA). Maîtrise des coûts fixes recommandée.` });
    } else {
        riskSignals.push({ label: "Structure des coûts", level: "✅ Faible risque", why: `Structure ${modelRigidity} (fixes ~${avgFixedRatio.toFixed(1)}%, variables ~${avgVariableRatio.toFixed(1)}%) — bonne flexibilité opérationnelle.` });
    }

    const instructions: string[] = [];
    if (strategy === "RÉDUIRE_HYPOTHÈSES") {
        instructions.push("Réduisez uniformément la ligne Chiffre d'Affaires de 8,0% sur toutes les années (An1 → AnN) → Impact : baisse VAN et TRI (cohérence bancaire).");
        instructions.push("Réduisez la marge brute projetée de 5,0 points (ou augmentez charges variables équivalentes) sur toute la période → Impact : baisse TRI, VAN plus réaliste.");
    } else {
        if (apportRatio < 30 && totalInvestment > 0) {
            const gapApport = totalInvestment * 0.3 - (data.personalContribution || 0);
            if (gapApport > 0) {
                instructions.push(`Augmentez la ligne Apport Personnel de ${fmtCurrency(gapApport)} → Impact : Ratio Apport/Investissement ≥ 30%.`);
            }
        }
        if (tri <= (data.discountRate || 10)) {
            instructions.push("Augmentez uniformément le Chiffre d'Affaires de 5,0% sur toutes les années (An1 → AnN) → Impact : hausse TRI et VAN.");
        }
        // Seuil de rentabilité: privilégier la tendance (objectif: repasser <75% rapidement).
        if (breakEvenRatioMax > 75 && y1?.turnover > 0) {
            if (firstYearBelow75 >= 0) {
                instructions.push(
                    `Stabilisez la montée en charge : objectif seuil < 75% atteint à partir de An ${firstYearBelow75 + 1}. Maintenez la trajectoire CA/charges fixes pour conserver la tendance.`
                );
            } else {
                const reduction = ((breakEvenRatioY1 / 100) * y1.turnover) - (0.75 * y1.turnover);
                if (reduction > 0) {
                    instructions.push(`Réduisez les charges fixes annuelles (Loyer/Personnel/Services) de ${fmtCurrency(reduction)} → Impact : seuil de rentabilité ≤ 75% du CA An1.`);
                }
            }
        }
    }

    const ratioLine = (name: string, valeur: string, seuil: string, verdict: "✅ Bon" | "⚠️ Limite" | "❌ Insuffisant", interpretation: string, instruction: string) => [
        `### Ratio : ${name}`,
        `**Valeur :** ${valeur} | **Seuil bancaire :** ${seuil} | **Verdict :** ${verdict}`,
        `**Interprétation :** ${interpretation}`,
        `**Instruction :** ${instruction}`
    ].join("\n");

    const ratios: string[] = [];
    ratios.push(ratioLine(
        "CA (An1 → AnN)",
        `${fmtCurrency(y1?.turnover)} → ${fmtCurrency(yN?.turnover)}`,
        "Trajectoire cohérente et justifiée",
        (y1?.turnover || 0) > 0 ? "✅ Bon" : "❌ Insuffisant",
        "Évolution du chiffre d’affaires sur la période de projection.",
        (y1?.turnover || 0) > 0 ? "Aucune." : "Renseignez vos produits (prix/quantités) pour calculer le CA."
    ));
    ratios.push(ratioLine(
        "VAN",
        fmtCurrency(van),
        "VAN > 0 (et cohérente vs capital investi)",
        van > 0 && !(totalInvestment > 0 && van > totalInvestment * 5) ? "✅ Bon" : "❌ Insuffisant",
        van > 0 ? "Création de valeur positive après actualisation." : "Destruction de valeur (VAN négative).",
        totalInvestment > 0 && van > totalInvestment * 5 ? "Corrigez les hypothèses (CA/marges) à la baisse jusqu'à obtenir VAN < 5x capital investi." : (van > 0 ? "Aucune." : "Augmentez la rentabilité (CA/marge) ou réduisez les charges fixes/variables.")
    ));
    ratios.push(ratioLine(
        "TRI",
        pct(tri),
        `TRI > ${data.discountRate || 10}%`,
        tri > (data.discountRate || 10) ? (tri > 200 ? "⚠️ Limite" : "✅ Bon") : "❌ Insuffisant",
        `Comparaison au taux d’actualisation (${data.discountRate || 10}%).`,
        tri > 200 ? "TRI atypiquement élevé : vérifiez hypothèses CA/marges (risque de surévaluation)." : (tri > (data.discountRate || 10) ? "Aucune." : "Augmentez CA/marges ou réduisez charges pour dépasser le taux d'actualisation.")
    ));
    ratios.push(ratioLine(
        "Délai de Récupération du Capital",
        s.payback ? `${s.payback.years} an(s) ${s.payback.months} mois` : "Non récupéré sur la période",
        "Payback récupéré sur l'horizon",
        s.payback ? "✅ Bon" : "❌ Insuffisant",
        "Temps nécessaire pour rembourser l’investissement via les flux.",
        s.payback ? "Aucune." : "Augmentez les cash-flows (CA/marges) ou réduisez CAPEX/charges fixes."
    ));
    ratios.push(ratioLine(
        "Marge nette (moyenne période)",
        pct(avgNetMargin),
        "> 15%",
        avgNetMargin >= 15 ? "✅ Bon" : "⚠️ Limite",
        "Indicateur de soutenabilité (capacité à absorber aléas).",
        avgNetMargin >= 15 ? "Aucune." : "Réduisez les charges variables/fixes ou améliorez le pricing."
    ));
    ratios.push(ratioLine(
        "Seuil de rentabilité (ratio CA) — An1 / max / min période",
        `${breakEvenRatioY1.toFixed(1)}% / ${breakEvenRatioMax.toFixed(1)}% / ${breakEvenRatioMin.toFixed(1)}%`,
        "< 75% (An1) et tendance maîtrisée",
        (breakEvenRatioMax <= 75)
            ? "✅ Bon"
            : (firstYearBelow75 >= 0 ? "⚠️ Limite" : "❌ Insuffisant"),
        "Analyse de marge de sécurité et vulnérabilité au CA sur la période.",
        (breakEvenRatioMax <= 75)
            ? "Aucune."
            : (firstYearBelow75 >= 0
                ? `Le ratio repasse sous 75% à partir de An ${firstYearBelow75 + 1}. Surveillez la montée en charge (charges fixes) et la trajectoire de CA.`
                : "Le ratio reste > 75% sur toute la période : réduisez charges fixes ou augmentez CA/marge pour sécuriser la couverture des charges.")
    ));
    ratios.push(ratioLine(
        "Ratio couverture dette (CAF/Service) — Croisière",
        debtCoverage !== null ? debtCoverage.toFixed(2) : "N/A (pas de dette)",
        "> 1.2",
        debtCoverage === null ? "✅ Bon" : (debtCoverage >= 1.2 ? "✅ Bon" : "❌ Insuffisant"),
        "Capacité à servir la dette sans tension de trésorerie.",
        debtCoverage === null ? "Aucune." : (debtCoverage >= 1.2 ? "Aucune." : "Augmentez CAF ou réduisez service de la dette (montant/durée/taux).")
    ));
    ratios.push(ratioLine(
        "Ratio Apport/Investissement",
        `${apportRatio.toFixed(1)}%`,
        "≥ 30%",
        apportRatio >= 30 ? "✅ Bon" : "❌ Insuffisant",
        "Solidité du montage et alignement promoteur / financeur.",
        apportRatio >= 30 ? "Aucune." : "Augmentez l'apport ou réduisez l'investissement initial."
    ));
    ratios.push(ratioLine(
        "Plan de Financement",
        planFinEquilibre ? "ÉQUILIBRÉ" : `DÉSÉQUILIBRÉ (${fmtCurrency(fp.gap)})`,
        "Équilibre impératif (écart ≈ 0)",
        planFinEquilibre ? "✅ Bon" : "❌ Insuffisant",
        "Condition de base de finançabilité (besoins = ressources).",
        planFinEquilibre ? "Aucune." : "Corrigez une ressource ou un besoin pour ramener l'écart à 0."
    ));

    const hardReject = dataErrors.length > 0;
    const highRisk = riskSignals.some(sg => sg.level === "❌ Risque élevé");
    const decision = hardReject ? "REFUSER" : highRisk ? "CONDITIONNER" : "ACCEPTER";
    const score =
        hardReject ? 4 :
        highRisk ? 6 :
        8;

    const recommendations: string[] = [];
    // recommandations chiffrées priorisées, cohérentes avec stratégie & risques
    recommendations.push(...instructions);
    if (debtCoverage !== null && debtCoverage < 1.2) {
        const cafTarget = 1.2 * annualDebtService;
        const cafGap = cafTarget - cafCruise;
        if (cafGap > 0) {
            recommendations.push(`Augmentez la CAF de croisière de ${fmtCurrency(cafGap)} → Impact : couverture dette ≥ 1,2.`);
        }
    }
    if (!planFinEquilibre) {
        recommendations.push(`Corrigez le plan de financement pour ramener l'écart à 0 (écart actuel = ${fmtCurrency(fp.gap)}).`);
    }
    // seuil de rentabilité: si jamais sous 75% sur période
    if (firstYearBelow75 < 0 && y1?.turnover > 0) {
        const fixedY1 = y1.totalExpenses - y1.materialsCost + y1.totalTaxes - y1.corporateTax;
        const contributionY1 = y1.turnover - y1.materialsCost;
        const fixedTarget = 0.75 * contributionY1;
        const reduction = fixedY1 - fixedTarget;
        if (reduction > 0) {
            recommendations.push(`Réduisez les charges fixes An1 de ${fmtCurrency(reduction)} → Impact : seuil de rentabilité ≈ 75% du CA (An1).`);
        }
    }

    const scoreText = `${score}/10`;

    return [
        "## 1. Vérification des données",
        ...(dataErrors.length ? dataErrors.map(e => `- ${e}`) : ["✅ Cohérence globale : OK."]),
        ...(dataWarnings.length ? ["", ...dataWarnings.map(w => `- ${w}`)] : []),
        "",
        "## 2. Évaluation globale",
        `- Horizon analysé : An1 → An${operatingYears.length}`,
        `- Secteur (référence) : ${structuredAnalysis ? structuredAnalysis.sector : "Non renseigné"}`,
        `- Synthèse : rentabilité (VAN/TRI) + risque (coûts, marge de sécurité, dette) évalués sur toute la période.`,
        `- Décision : ${decision}`,
        "",
        "## 3. Analyse des ratios financiers",
        ratios.join("\n\n"),
        "",
        "## 4. Analyse du modèle économique (section clé)",
        "1. Secteur identifié",
        `- ${structuredAnalysis ? structuredAnalysis.sector : "Non renseigné"}`,
        "2. Modèle économique",
        `- ${structuredAnalysis ? `activity_type=${structuredAnalysis.profile.activity_type} | revenue_model=${structuredAnalysis.profile.revenue_model} | sales_channel=${structuredAnalysis.profile.sales_channel} | customer_type=${structuredAnalysis.profile.customer_type.join(", ")}` : "Profil structuré non renseigné."}`,
        "3. Attributs du projet",
        ...(structuredAnalysis ? [
            `- Digital : ${structuredAnalysis.attributes.digital ? "oui" : "non"}`,
            `- Scalabilité : ${structuredAnalysis.attributes.scalable}`,
            `- Revenus récurrents : ${structuredAnalysis.attributes.recurring_revenue ? "oui" : "non"}`,
            `- Intensité CAPEX : ${structuredAnalysis.attributes.capex}`,
            `- Complexité opérationnelle : ${structuredAnalysis.attributes.operational_complexity}`,
        ] : ["- Non calculable : renseignez le profil d'activité (secteur/type/modèle/canal/client)."]),
        "4. Analyse des coûts",
        `- Charges fixes (moyenne période) : ≈ ${avgFixedRatio.toFixed(1)}% du CA`,
        `- Charges variables (moyenne période) : ≈ ${avgVariableRatio.toFixed(1)}% du CA`,
        `- Robustesse / rigidité : ${modelRigidity}`,
        `- Sensibilité au chiffre d’affaires : ${avgFixedRatio >= 35 ? "élevée" : "modérée"}`,
        `- Coûts clés (mapping) : ${structuredAnalysis ? structuredAnalysis.costs.join(", ") : "Non calculable"}`,
        "5. Analyse des revenus",
        `- Logique de revenus (mapping) : ${structuredAnalysis ? structuredAnalysis.revenue_logic : "Non calculable"}`,
        `- Trajectoire CA : ${fmtCurrency(y1?.turnover)} → ${fmtCurrency(yN?.turnover)} (An1→AnN)`,
        "6. Risques",
        `- Risques sectoriels (mapping) : ${structuredAnalysis ? structuredAnalysis.risks.join(", ") : "Non calculable"}`,
        `- Risque financier : ${riskSignals.some(r => r.level === "❌ Risque élevé") ? "élevé" : riskSignals.some(r => r.level === "⚠️ Risque modéré") ? "modéré" : "faible"}`,
        "7. Scalabilité",
        `- ${structuredAnalysis ? structuredAnalysis.scalability : "Non calculable"}`,
        "8. Points faibles ⚠️",
        ...(structuredAnalysis?.warnings?.length ? structuredAnalysis.warnings.map(w => `- ${w}`) : []),
        ...riskSignals
            .filter(sg => sg.level !== "✅ Faible risque")
            .map(sg => `- ${sg.level} — ${sg.label} : ${sg.why}`),
        ...(riskSignals.every(sg => sg.level === "✅ Faible risque") ? ["- Aucun point faible majeur détecté."] : []),
        "9. Recommandations",
        ...(recommendations.length ? recommendations.slice(0, 5).map((t, idx) => `- Reco ${idx + 1} : ${t}`) : ["- Reco 1 : Aucune."]),
        "",
        "## 5. Analyse du seuil de rentabilité",
        `- Ratio point mort/CA (An1 / max / min période) : ${breakEvenRatioY1.toFixed(1)}% / ${breakEvenRatioMax.toFixed(1)}% / ${breakEvenRatioMin.toFixed(1)}%`,
        `- Interprétation : ${breakEvenRatioMax <= 75
            ? "marge de sécurité acceptable sur toute la période."
            : firstYearBelow75 >= 0
                ? `tension initiale puis amélioration (≤ 75% à partir de An ${firstYearBelow75 + 1}).`
                : "marge de sécurité insuffisante sur toute la période (risque opérationnel élevé)."
        }`,
        "",
        "## 6. Recommandations",
        ...(recommendations.length ? recommendations.slice(0, 5).map((t, idx) => `- **Action ${idx + 1} :** ${t}`) : ["- **Action 1 :** Aucune."]),
        "",
        "## 7. Décision finale",
        `- Qualification du risque (graduée) :`,
        ...riskSignals.map(sg => `- ${sg.level} — ${sg.label} : ${sg.why}`),
        `- Score de banquabilité : ${scoreText}`,
        `- Décision motivée : ${decision}${hardReject ? " (erreurs bloquantes)" : highRisk ? " (risques à conditionner)" : " (risques maîtrisés)"}`,
        `- Conditions éventuelles : ${decision === "CONDITIONNER" ? "Réviser charges fixes / hypothèses CA, préciser garanties et sécuriser marge de sécurité." : "Aucune condition majeure."}`
    ].join("\n");
}

function buildAuditPrompt(data: BusinessPlanData): string {
    const fmtCurrency = (n?: number) =>
        n !== undefined && n !== 0
            ? new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND" }).format(n)
            : "Non renseigné";
    const pct = (n?: number) => n !== undefined ? n.toFixed(1) + "%" : "N/A";
    const yesNo = (v?: boolean) => (v ? "Oui" : "Non");

    // ── Compute financial ratios ──────────────────────────────────────
    let ratiosBlock = "ERREUR : Données financières insuffisantes pour calculer les ratios.";
    let triValue = 0;
    let vanValue = 0;
    let breakEvenRatioY1 = 0;
    let totalInvestmentCalc = 0;
    let overvaluationDetected = false;
    let underperformanceDetected = false;

    try {
        const results = calculateOperatingResults(data);
        const s = results.summary;
        const inv = calculateInvestment(data.equipments || []);
        const fp = calculateFinancialPlan(data);
        const cruiseData = s.cruiseYearData;
        const firstOperatingIndex = data.includeYearZero ? 1 : 0;
        const operatingYears = results.years.slice(firstOperatingIndex);
        const y1 = operatingYears[0];

        triValue = s.roi || 0;
        vanValue = s.van || 0;
        totalInvestmentCalc = inv.totalTTC + (data.startupCosts || 0) + (data.workingCapital || 0);

        const netMarginPct = cruiseData.turnover > 0
            ? ((cruiseData.netResult / cruiseData.turnover) * 100)
            : 0;
        const caf = cruiseData.netResult + cruiseData.amortization;
        const annualLoanYears = Math.max((data.loanDuration || 60) / 12, 1);
        const annualDebtService = cruiseData.financialCharges + (data.loanAmount || 0) / annualLoanYears;
        const debtCoverageNum = annualDebtService > 0 ? caf / annualDebtService : null;
        const apportRatio = totalInvestmentCalc > 0
            ? ((data.personalContribution || 0) / totalInvestmentCalc * 100).toFixed(1)
            : "N/A";

        // ── BEP An1 : calculé sur les données d'An1 (et non le BEP de croisière vs CA An1) ──
        // Bug corrigé : s.breakEvenPoint = BEP année croisière ; le comparer à CA An1 est incorrect
        // car les charges augmentent chaque année (recrutements, croissance). On calcule le BEP propre à An1.
        const y1Fixed = y1 ? (y1.totalExpenses - y1.materialsCost + y1.totalTaxes - y1.corporateTax) : 0;
        const y1Variable = y1 ? y1.materialsCost : 0;
        const y1CM = y1 && y1.turnover > 0 ? (y1.turnover - y1Variable) : 0;
        const y1BEP = y1CM > 0 ? (y1Fixed * (y1?.turnover ?? 0)) / y1CM : Infinity;
        breakEvenRatioY1 = y1 && y1.turnover > 0 ? (y1BEP / y1.turnover) * 100 : 0;

        overvaluationDetected = totalInvestmentCalc > 0 && (vanValue > totalInvestmentCalc * 5 || triValue > 120);
        underperformanceDetected = triValue <= (data.discountRate || 10) || vanValue < 0 || breakEvenRatioY1 > 75;

        const turnoverSeries = operatingYears.map((y, idx) => `An ${idx + 1}: ${fmtCurrency(y.turnover)}`).join(" | ");
        const netSeries = operatingYears.map((y, idx) => `An ${idx + 1}: ${fmtCurrency(y.netResult)}`).join(" | ");
        const cashSeries = operatingYears.map((y, idx) => `An ${idx + 1}: ${fmtCurrency(y.cashFlow)}`).join(" | ");
        const minTurnover = operatingYears.length ? Math.min(...operatingYears.map(y => y.turnover)) : 0;
        const maxTurnover = operatingYears.length ? Math.max(...operatingYears.map(y => y.turnover)) : 0;
        const avgNetMargin = operatingYears.length
            ? (operatingYears.reduce((acc, y) => acc + (y.turnover > 0 ? (y.netResult / y.turnover) * 100 : 0), 0) / operatingYears.length)
            : 0;
        const maxBreakEvenRatio = operatingYears.length
            ? Math.max(...operatingYears.map(y => (y.turnover > 0 ? (s.breakEvenPoint / y.turnover) * 100 : 0)))
            : 0;

        ratiosBlock = [
            "RATIOS FINANCIERS CALCULÉS (SUR TOUTE LA DURÉE DE PROJECTION) :",
            `- Horizon analysé : ${operatingYears.length} an(s) (An 1 -> An ${operatingYears.length})`,
            `- CA série complète : ${turnoverSeries}`,
            `- Résultat net série complète : ${netSeries}`,
            `- Cash-flow série complète : ${cashSeries}`,
            `- CA min/max période : ${fmtCurrency(minTurnover)} / ${fmtCurrency(maxTurnover)}`,
            `- Marge nette moyenne période : ${avgNetMargin.toFixed(1)}%`,
            "- CA Année 1 : " + fmtCurrency(y1?.turnover),
            "- CA Croisière : " + fmtCurrency(cruiseData.turnover),
            "- Résultat Net Croisière : " + fmtCurrency(cruiseData.netResult),
            "- Marge Nette Croisière : " + netMarginPct.toFixed(1) + "% (seuil bancaire : >15%)",
            "- CAF Croisière : " + fmtCurrency(caf),
            "- Service Dette Annuel : " + fmtCurrency(annualDebtService),
            "- Ratio Couverture Dette (CAF/Service) : " + (debtCoverageNum !== null ? debtCoverageNum.toFixed(2) + " (seuil : >1.2)" : "N/A (pas de dette)"),
            "- Ratio Apport/Investissement : " + apportRatio + "% (seuil minimal bancaire : 30%)",
            "- VAN (" + data.discountRate + "% actualisation) : " + fmtCurrency(vanValue),
            "- TRI : " + pct(triValue) + " (taux actualisation : " + data.discountRate + "%)",
            "- Délai de Récupération : " + (s.payback ? s.payback.years + " an(s) " + s.payback.months + " mois" : "Non récupéré sur la période"),
            "- Seuil de Rentabilité (croisière) : " + fmtCurrency(s.breakEvenPoint),
            "- Seuil de Rentabilité vs CA An1 : " + breakEvenRatioY1.toFixed(1) + "% (seuil critique : 75%)",
            "- Seuil de Rentabilité ratio maximal sur période : " + maxBreakEvenRatio.toFixed(1) + "%",
            "- Marge sur Coût Variable : " + fmtCurrency(s.contributionMarginCruise),
            "- Total Investissement (TTC + Frais + BFR) : " + fmtCurrency(totalInvestmentCalc),
            "- Plan de Financement : " + (Math.abs(fp.gap) < 1 ? "EQUILIBRE" : "DESEQUILIBRE — Ecart : " + fmtCurrency(fp.gap)),
            "- Orientation d'ajustement imposée : " + (overvaluationDetected ? "RÉDUCTION DES HYPOTHÈSES (CA/MARGE)" : underperformanceDetected ? "RENFORCEMENT DES HYPOTHÈSES (CA/MARGE)" : "STABILISATION")
        ].join("\n");
    } catch (_) {
        ratiosBlock = "ERREUR DE CALCUL : Les données financières sont incomplètes ou incohérentes.";
    }

    // ── Data validation block ──────────────────────────────────────────────
    const errors: string[] = [];
    const warnings: string[] = [];
    const numericAdjustments: string[] = [];
    let forcedGlobalCap: number | null = null;
    let forcedTechnicalCap: number | null = null;
    let hardRejection = false;

    const eqs = data.equipments || [];
    if (eqs.length === 0) {
        errors.push("ERREUR : Aucun équipement renseigné dans le tableau d'investissement.");
    }
    eqs.forEach((eq, i) => {
        if (!eq.priceUnitHT || eq.priceUnitHT === 0)
            errors.push("ERREUR : Prix manquant pour l'équipement " + (eq.name || "#" + (i + 1)) + " (ligne " + (i + 1) + ").");
        if (!eq.quantity || eq.quantity === 0)
            errors.push("ERREUR : Quantité nulle pour l'équipement " + (eq.name || "#" + (i + 1)) + ".");
    });
    if (eqs.some(eq => !eq.priceUnitHT || eq.priceUnitHT <= 0 || !eq.quantity || eq.quantity <= 0)) {
        forcedTechnicalCap = 2.9;
        warnings.push("ATTENTION : Tableau des investissements incomplet — score Technique imposé < 3/10.");
    }

    const prods = data.products || [];
    if (prods.length === 0) {
        errors.push("ERREUR : Aucun produit/service renseigné — le CA ne peut être calculé.");
    }
    prods.forEach((p, i) => {
        if (!p.priceUnit || p.priceUnit === 0)
            errors.push("ERREUR : Prix unitaire nul pour " + (p.name || "Produit #" + (i + 1)) + ".");
        if (!p.quantityAnnual || p.quantityAnnual === 0)
            warnings.push("ATTENTION : Quantité annuelle nulle pour " + (p.name || "Produit #" + (i + 1)) + " — vérifier la saisie.");
    });

    if (!data.personalContribution || data.personalContribution === 0)
        errors.push("ERREUR : Apport personnel non renseigné — condition de rejet automatique.");
    if (!data.loanAmount || data.loanAmount === 0)
        warnings.push("ATTENTION : Aucun crédit bancaire déclaré.");
    if (!data.hasGuarantees)
        warnings.push("ATTENTION : Aucune garantie réelle mentionnée — facteur de risque majeur pour le comité.");
    if (triValue <= (data.discountRate || 10)) {
        errors.push("ERREUR CRITIQUE : TRI (" + triValue.toFixed(1) + "%) inférieur ou égal au taux d'actualisation (" + (data.discountRate || 10) + "%) — CONDITION DE REJET. Note globale plafonnée à 4/10.");
        forcedGlobalCap = 4;
        hardRejection = true;
    }
    if (vanValue < 0)
        errors.push("ERREUR : VAN négative (" + fmtCurrency(vanValue) + ") — le projet détruit de la valeur. Note plafonnée à 4/10.");
    if (totalInvestmentCalc > 0 && vanValue > totalInvestmentCalc * 5)
        errors.push("ERREUR DE CALCUL : VAN (" + fmtCurrency(vanValue) + ") délirante par rapport au capital investi (" + fmtCurrency(totalInvestmentCalc) + "). Vérification des hypothèses obligatoire.");
    if (breakEvenRatioY1 > 75) {
        errors.push("ERREUR : Seuil de rentabilité = " + breakEvenRatioY1.toFixed(1) + "% du CA An1 (seuil critique : 75%) — RISQUE ÉLEVÉ DE FAILLITE la première année.");
        hardRejection = true;
    }
    if (!data.marketStudy || data.marketStudy.length < 50)
        warnings.push("ATTENTION : Étude de marché insuffisante ou absente (moins de 50 caractères).");
    if (!data.conclusion || data.conclusion.length < 30)
        warnings.push("ATTENTION : Conclusion non renseignée ou trop courte.");
    if (errors.some(e => /plafonnée à 4\/10/i.test(e)) && forcedGlobalCap === null) {
        forcedGlobalCap = 4;
    }

    // Ajustements numériques directs (instructions de saisie) - cohérents et non contradictoires
    if ((data.personalContribution || 0) > 0 && totalInvestmentCalc > 0) {
        const minApport = totalInvestmentCalc * 0.3;
        const gapApport = minApport - (data.personalContribution || 0);
        if (gapApport > 0) {
            numericAdjustments.push(
                `Augmentez la ligne Apport Personnel de ${fmtCurrency(gapApport)} pour atteindre 30,0% du plan d'investissement et stabiliser le ratio Apport/Investissement.`
            );
        }
    }
    if (overvaluationDetected) {
        numericAdjustments.push(
            "Réduisez uniformément la ligne Chiffre d'Affaires de 8,0% sur toutes les années de projection (An1 à AnN) pour réaligner VAN et TRI."
        );
        numericAdjustments.push(
            "Réduisez la marge brute projetée de 5,0 points (hausse des charges variables équivalente) sur toute la période pour ramener le TRI à un niveau bancaire crédible."
        );
    } else {
        if (breakEvenRatioY1 > 75 && Number.isFinite(breakEvenRatioY1)) {
            const y1Turnover = (() => {
                try {
                    const firstOperatingIndex = data.includeYearZero ? 1 : 0;
                    return calculateOperatingResults(data).years[firstOperatingIndex]?.turnover || 0;
                } catch {
                    return 0;
                }
            })();
            if (y1Turnover > 0) {
                const targetBreakEven = y1Turnover * 0.75;
                const breakEvenReduction = Math.max(0, (breakEvenRatioY1 / 100) * y1Turnover - targetBreakEven);
                if (breakEvenReduction > 0) {
                    numericAdjustments.push(
                        `Réduisez les charges fixes annuelles (lignes Loyer/Personnel/Services extérieurs) de ${fmtCurrency(breakEvenReduction)} pour ramener le seuil de rentabilité à 75,0% du CA An1.`
                    );
                }
            }
        }
        if (triValue <= (data.discountRate || 10)) {
            const minTriGap = (data.discountRate || 10) - triValue + 1;
            numericAdjustments.push(
                `Augmentez la ligne Chiffre d'Affaires de ${minTriGap.toFixed(1)}% sur toute la période de projection (pas uniquement An1) pour repositionner le TRI au-dessus du taux d'actualisation.`
            );
        }
    }

    const validationLines: string[] = [];
    if (errors.length > 0) {
        validationLines.push("ERREURS BLOQUANTES (" + errors.length + ") :");
        errors.forEach(e => validationLines.push("  - " + e));
    } else {
        validationLines.push("✅ Aucune erreur bloquante détectée.");
    }
    if (warnings.length > 0) {
        validationLines.push("AVERTISSEMENTS (" + warnings.length + ") :");
        warnings.forEach(w => validationLines.push("  - " + w));
    }
    const validationBlock = validationLines.join("\n");
    const guards: AuditGuards = {
        forcedGlobalCap,
        forcedTechnicalCap,
        hardRejection,
        sourceErrors: errors,
        sourceWarnings: warnings,
        numericAdjustments: numericAdjustments.slice(0, 5),
    };
    const guardBlock = [
        "— PROTOCOLE BANCAIRE IMPÉRATIF (NON NÉGOCIABLE) —",
        `Plafond Note Globale imposé : ${guards.forcedGlobalCap !== null ? guards.forcedGlobalCap + "/10" : "Aucun"}`,
        `Plafond Score Technique imposé : ${guards.forcedTechnicalCap !== null ? "< " + guards.forcedTechnicalCap.toFixed(1).replace(".", ",") + "/10" : "Aucun"}`,
        `Rejet immédiat : ${guards.hardRejection ? "OUI" : "NON"}`,
    ].join("\n");
    const numericBlock = guards.numericAdjustments.length > 0
        ? guards.numericAdjustments.map((ins, idx) => `- Instruction ${idx + 1} : ${ins}`).join("\n")
        : "- Instruction 1 : Aucune correction numérique additionnelle détectée.";

    return [
        "DONNÉES DU BUSINESS PLAN À ÉVALUER :",
        "",
        "— VÉRIFICATION DES DONNÉES SOURCES —",
        validationBlock,
        "",
        guardBlock,
        "",
        "— PROMOTEUR —",
        "Nom : " + (data.promoterName || "Non renseigné"),
        "Instruction : " + (data.promoterEducationLevel || "Non renseigné"),
        "Expérience : " + (data.hasExperience ? data.experienceYears + " ans" : "Aucune"),
        "Qualifications : Scientifiques=" + yesNo(data.hasScientificQualifications) + ", Professionnelles=" + yesNo(data.hasProfessionalQualifications),
        "",
        "— PROJET —",
        "Titre : " + (data.projectTitle || "Non renseigné"),
        "Description : " + (data.projectDescription || "Non renseigné"),
        "Localisation : " + (data.projectLocation || "Non renseigné") + " | Forme juridique : " + (data.legalStructure || "Non renseigné"),
        "Étude de marché : " + (data.marketStudy || "Non renseignée"),
        "Forces : " + (data.strengths || "Non renseigné") + " | Faiblesses : " + (data.weaknesses || "Non renseigné"),
        "Stratégie marketing : " + (data.marketingStrategy || "Non renseignée"),
        "",
        "— MONTAGE FINANCIER —",
        "Investissement total : " + fmtCurrency(data.investmentCost),
        "Apport personnel : " + fmtCurrency(data.personalContribution) + " (" + (data.investmentCost > 0 ? ((data.personalContribution || 0) / data.investmentCost * 100).toFixed(1) : 0) + "% du total)",
        "Crédit bancaire : " + fmtCurrency(data.loanAmount) + " sur " + data.loanDuration + " mois à " + data.loanInterestRate + "%",
        "Garanties : " + yesNo(data.hasGuarantees) + " " + (data.guaranteesDetails || ""),
        "Taux croissance CA : " + data.turnoverGrowthRate + "%/an | Evolution charges : " + data.expensesGrowthRate + "%/an",
        "",
        ratiosBlock,
        "",
        "— AJUSTEMENTS NUMÉRIQUES DIRECTS PRÉ-CALCULÉS —",
        numericBlock,
        "",
        "— CONCLUSION —",
        data.conclusion || "Non renseignée"
    ].join("\n");
}

// ─── Structured result renderer ───────────────────────────────────────────────

function AuditReport({ text }: { text: string }) {
    const lines = text.split("\n");
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [lockedTooltip, setLockedTooltip] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const ratioTooltips: Record<string, { signification: string; formule: string }> = {
        van: {
            signification: "Mesure la creation de valeur de l'investissement apres actualisation des flux. Elle doit etre > 0.",
            formule: "VAN = Σ [CFt / (1 + i)^t] - I0"
        },
        tri: {
            signification: "Taux pour lequel la VAN est nulle. Il represente la rentabilite intrinseque du projet.",
            formule: "0 = Σ [CFt / (1 + TRI)^t] - I0"
        },
        drc: {
            signification: "Temps necessaire pour que les flux de tresorerie cumules remboursent l'investissement initial.",
            formule: "DRC = Investissement / Flux moyens annuels"
        },
        marge_sur_cout_variable: {
            signification: "Ce qui reste des ventes apres deduction des charges directement liees a l'activite.",
            formule: "(CA - Charges variables) / CA"
        },
        seuil_de_rentabilite: {
            signification: "Niveau d'activite minimum pour couvrir l'integralite des charges (resultat = 0).",
            formule: "Seuil = Charges fixes / Taux de marge sur cout variable"
        }
    };

    const getRatioTooltip = (heading: string) => {
        const h = heading.toLowerCase();
        if (h.includes("van")) return ratioTooltips.van;
        if (h.includes("tri")) return ratioTooltips.tri;
        if (h.includes("drc") || h.includes("delai de recuperation")) return ratioTooltips.drc;
        if (h.includes("marge sur cout variable")) return ratioTooltips.marge_sur_cout_variable;
        if (h.includes("seuil de rentabilite") || h.includes("point mort")) return ratioTooltips.seuil_de_rentabilite;
        return null;
    };

    const scoreMatch = text.match(/(\d+(?:[.,]\d+)?)\s*\/\s*10/);
    const scoreRaw = scoreMatch ? parseFloat(scoreMatch[1].replace(",", ".")) : null;
    const scoreColor =
        scoreRaw === null ? "text-gray-500" :
            scoreRaw >= 7 ? "text-emerald-600" :
                scoreRaw >= 5 ? "text-amber-600" : "text-red-600";

    return (
        <div className="space-y-4 text-sm leading-relaxed">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                // ## Section headers
                if (/^##\s/.test(trimmed)) {
                    const heading = trimmed.replace(/^#+\s*/, "");
                    return (
                        <h3 key={i} className="font-bold text-base text-blue-700 dark:text-blue-400 border-b border-blue-200 dark:border-blue-800 pb-1 mt-5 first:mt-0">
                            {heading}
                        </h3>
                    );
                }

                // ### Sub-headers (ratio names)
                if (/^###\s/.test(trimmed)) {
                    const heading = trimmed.replace(/^#+\s*/, "");
                    const tooltipData = getRatioTooltip(heading);
                    const tooltipKey = `${heading}-${i}`;
                    const tooltipVisible = activeTooltip === tooltipKey || lockedTooltip === tooltipKey;
                    return (
                        <div key={i} className="relative group flex items-center gap-2 mt-3 mb-1 overflow-visible">
                            <h4 className="font-semibold text-sm text-foreground/80">
                                📊 {heading}
                            </h4>
                            {tooltipData && (
                                <>
                                    <button
                                        type="button"
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                        aria-label={`Aide ratio ${heading}`}
                                        onMouseEnter={(event) => {
                                            const rect = event.currentTarget.getBoundingClientRect();
                                            setTooltipPosition({
                                                x: Math.min(window.innerWidth - 340, Math.max(8, rect.left)),
                                                y: Math.max(10, rect.top - 10),
                                            });
                                            setActiveTooltip(tooltipKey);
                                        }}
                                        onMouseLeave={() => {
                                            if (lockedTooltip !== tooltipKey) {
                                                setActiveTooltip(null);
                                            }
                                        }}
                                        onClick={(event) => {
                                            const rect = event.currentTarget.getBoundingClientRect();
                                            setTooltipPosition({
                                                x: Math.min(window.innerWidth - 340, Math.max(8, rect.left)),
                                                y: Math.max(10, rect.top - 10),
                                            });
                                            if (lockedTooltip === tooltipKey) {
                                                setLockedTooltip(null);
                                                setActiveTooltip(null);
                                            } else {
                                                setLockedTooltip(tooltipKey);
                                                setActiveTooltip(tooltipKey);
                                            }
                                        }}
                                    >
                                        <Info className="h-3.5 w-3.5" />
                                    </button>
                                    <div
                                        className={`fixed bottom-full mb-2 w-[320px] max-w-[90vw] bg-slate-800 text-white text-xs rounded p-2 shadow-lg leading-relaxed z-50 invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity ${tooltipVisible ? "visible opacity-100" : ""}`}
                                        style={{
                                            left: `${tooltipPosition.x}px`,
                                            top: `${tooltipPosition.y}px`,
                                            transform: "translateY(-100%)",
                                        }}
                                    >
                                        <p><strong>Signification :</strong> {tooltipData.signification}</p>
                                        <p className="mt-1"><strong>Formule :</strong> {tooltipData.formule}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                }

                // Score / banquabilité line
                if (/score.*banquabilit|banquabilit.*score/i.test(trimmed) && scoreRaw !== null) {
                    return (
                        <div key={i} className={`flex items-center gap-3 font-bold text-lg ${scoreColor} bg-muted/50 p-3 rounded-lg`}>
                            <Star className="h-5 w-5 fill-current" />
                            <span>{trimmed.replace(/\*\*/g, "")}</span>
                        </div>
                    );
                }

                // Numerical adjustment lines (contain →)
                if (/→/.test(trimmed)) {
                    const clean = trimmed.replace(/^[-•*]\s*/, "").replace(/\*\*/g, "");
                    return (
                        <div key={i} className="flex gap-2 pl-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="font-medium text-blue-800 dark:text-blue-200">{clean}</span>
                        </div>
                    );
                }

                // Verdict lines (✅ ⚠️ ❌)
                if (/✅|⚠️|❌/.test(trimmed)) {
                    const isGood = /✅/.test(trimmed);
                    const isWarn = /⚠/.test(trimmed);
                    return (
                        <div key={i} className={`flex gap-2 pl-2 rounded p-1.5 ${
                            isGood ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200" :
                            isWarn ? "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200" :
                                     "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200"
                        }`}>
                            <span>{trimmed.replace(/\*\*/g, "")}</span>
                        </div>
                    );
                }

                // Bullet points
                if (/^[-•*]\s/.test(trimmed)) {
                    const content = trimmed.replace(/^[-•*]\s*/, "");
                    const isAction = /^(CAF|Ratio|Garantie|Ajust|Augmenter|Réduire|Renforcer|Préciser)/i.test(content);
                    return (
                        <div key={i} className="flex gap-2 pl-2">
                            {isAction ? (
                                <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            )}
                            <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>") }} />
                        </div>
                    );
                }

                // Bold lines
                if (/\*\*/.test(trimmed)) {
                    const formatted = trimmed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
                    return <p key={i} className="text-foreground/90" dangerouslySetInnerHTML={{ __html: formatted }} />;
                }

                return <p key={i} className="text-foreground/80">{trimmed}</p>;
            })}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AuditDialog({ businessPlanData, reportContent, onReportGenerated }: AuditDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);

    useEffect(() => {
        if (typeof reportContent === "string") {
            setReport(reportContent);
        }
    }, [reportContent]);

    useEffect(() => {
        if (isOpen) {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
    }, [isOpen]);

    const AUDIT_SYSTEM_PROMPT = [
        "Tu es un Auditeur de Risques de Crédit mandaté par un comité bancaire. Ta priorité absolue est la PROTECTION DU CAPITAL, pas l'encouragement. Tu appliques les standards Bâle III et les critères ANETI/BTS. Si une donnée est manquante ou incohérente, tu dois être sévère et le documenter explicitement.",
        "",
        "PROTOCOLE DE NOTATION STRICT :",
        "- 0 à 4/10 : Dossier NON FINANÇABLE (erreurs majeures, données manquantes, TRI ≤ taux d'actualisation, VAN négative).",
        "- 5 à 7/10 : Dossier crédible mais nécessite des ajustements structurels avant soumission.",
        "- 8 à 10/10 : Dossier exceptionnel — ratios cohérents, risques maîtrisés.",
        "",
        "CONDITIONS DE REJET IMMÉDIAT (note plafonnée à 4/10) :",
        "1. TRI = 0% ou inférieur au taux d'actualisation.",
        "2. VAN négative.",
        "3. Plan de financement déséquilibré.",
        "4. Seuil de rentabilité > 75% du CA Année 1.",
        "5. Absence d'apport personnel.",
        "6. Toute contrainte 'Plafond Note Globale imposé' fournie dans les données sources.",
        "",
        "CONTRAINTE TECHNIQUE OBLIGATOIRE :",
        "- Si le tableau des investissements est incomplet (prix/quantité d'équipement manquant, logiciel essentiel sous-évalué ou absent), alors le score TECHNIQUE doit être strictement inférieur à 3/10.",
        "",
        "COHÉRENCE VAN :",
        "- Si VAN > 5x capital investi, le signaler explicitement comme 'ERREUR DE CALCUL' et exiger correction.",
        "",
        "STRUCTURE OBLIGATOIRE DU RAPPORT (5 sections dans cet ordre exact) :",
        "",
        "## Vérification des Données Sources",
        "Liste les erreurs et avertissements détectés. Pour chaque erreur : 'ERREUR : [description précise]'. Pour chaque avertissement : 'ATTENTION : [description]'. Si tout est correct : '✅ Aucun problème détecté.'",
        "",
        "## Évaluation Globale",
        "Verdict direct (3 phrases max) : viabilité du concept, niveau de risque crédit, décision recommandée parmi (Financer / Conditionner / Rejeter).",
        "",
        "## Audit des Ratios Financiers",
        "Pour chaque indicateur, format strict :",
        "### Ratio : [Nom]",
        "**Valeur :** [chiffre exact] | **Seuil bancaire :** [standard] | **Verdict :** [✅ Bon / ⚠️ Limite / ❌ Insuffisant]",
        "**Instruction :** [Si insuffisant : instruction directe, ex: 'Augmentez la ligne Chiffre d\\'Affaires An1 de X TND pour atteindre le seuil.']",
        "Couvrir obligatoirement : VAN, TRI, Délai de Récupération, Marge Nette, Seuil de Rentabilité, Ratio Couverture Dette (CAF/Service Dette), Ratio Apport/Investissement.",
        "L'analyse doit porter sur TOUTE la période de projection, avec référence explicite aux années extrêmes (An1 et AnN) et à la tendance globale.",
        "",
        "## Instructions d'Ajustements Numériques",
        "Maximum 5 instructions directes et chiffrées. Format obligatoire :",
        "- **Instruction 1 :** Augmentez [paramètre] de [X TND ou X%] → Impact : [effet mesurable sur ratio Y]",
        "- **Instruction 2 :** Réduisez [paramètre] de [X] → Impact : [...]",
        "Réutilise en priorité les 'AJUSTEMENTS NUMÉRIQUES DIRECTS PRÉ-CALCULÉS' fournis dans les données.",
        "INTERDICTION DE CONTRADICTION: ne jamais proposer simultanément des actions opposées (ex: augmenter le CA et réduire VAN/TRI via baisse CA). Choisir une stratégie unique cohérente.",
        "",
        "## Décision de Crédit",
        "- CAF actuelle : [X TND] | CAF cible minimale : [Y TND]",
        "- Ratio couverture dette : [Z]",
        "- Garanties : [analyse de suffisance]",
        "- Score de Banquabilité Final : [X] / 10 — [FINANCER / CONDITIONNER À / REJETER] — [justification 1 phrase]",
        "Respect impératif des plafonds : si 'Plafond Note Globale imposé : 4/10', la note finale ne peut jamais dépasser 4/10.",
        "",
        "STYLE : Chiffres avant tout. Zéro politesse inutile. Langue : Français financier institutionnel."
    ].join("\n");

    const handleAudit = async () => {
        setIsLoading(true);
        setReport(null);
        setIsOpen(true);

        try {
            // 1) Source de vérité: rapport déterministe interne
            const internalReport = generateDeterministicAuditReport(businessPlanData);

            // 2) Si IA disponible: reformulation/structuration basée UNIQUEMENT sur le rapport interne
            // (aucune invention de chiffres, pas de nouveaux seuils non présents).
            let finalReport = internalReport;
            try {
                await aiManager.init();
                const aiSystem = [
                    "Tu es un analyste bancaire senior. Tu DOIS te baser uniquement sur le RAPPORT INTERNE fourni.",
                    "Interdictions absolues :",
                    "- Ne jamais inventer de chiffres, seuils, garanties, conditions, ni corriger/altérer les valeurs.",
                    "- Ne pas ajouter de nouveaux ratios qui ne figurent pas dans le rapport interne.",
                    "- Ne pas contredire les conclusions et le scoring internes ; tu peux seulement clarifier et mieux structurer.",
                    "",
                    "Objectif : rendre le rapport plus lisible, plus professionnel, mieux hiérarchisé, sans changer le fond.",
                    "Format : conserver des sections Markdown avec '##' et les sous-sections ratios avec '### Ratio : ...'.",
                ].join("\n");

                const aiPrompt = [
                    "RAPPORT INTERNE (SOURCE DE VÉRITÉ) :",
                    internalReport,
                    "",
                    "TÂCHE : Reformule et améliore la clarté/structure sans modifier aucun chiffre ni verdict.",
                ].join("\n");

                const aiResult = await aiManager.generateSection(aiPrompt, {
                    maxTokens: 2200,
                    temperature: 0.1,
                    systemInstruction: aiSystem,
                });

                if (aiResult && aiResult.trim().length > 0) {
                    finalReport = aiResult.trim();
                }
            } catch {
                // Si IA non configurée / erreur provider: fallback silencieux sur le rapport interne
                finalReport = internalReport;
            }

            setReport(finalReport);
            onReportGenerated?.(finalReport);
        } catch (error) {
            console.error(error);
            const msg = error instanceof Error ? error.message : "Erreur inconnue";
            toast.error("Erreur lors de l'audit : " + msg);
            setIsOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const generateProfessionalPDF = (reportContent: string) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 18;
        const contentWidth = pageWidth - (2 * margin);
        let currentY = 24;

        const ensurePage = (nextHeight = 6) => {
            if (currentY + nextHeight > 270) {
                doc.addPage();
                currentY = 24;
            }
        };

        const normalizeInlineMarkdown = (line: string) =>
            line
                .replace(/^#{1,6}\s*/g, "")
                .replace(/\*\*/g, "")
                .replace(/`/g, "")
                .replace(/^\s*[-•*]\s*/g, "• ")
                .replace(/\|/g, " | ")
                .replace(/\s+/g, " ")
                .trim();

        const writeParagraph = (text: string, lineHeight = 6) => {
            const clean = normalizeInlineMarkdown(text);
            if (!clean) return;
            const lines = doc.splitTextToSize(clean, contentWidth);
            lines.forEach((line: string) => {
                ensurePage(lineHeight);
                doc.text(line, margin, currentY);
                currentY += lineHeight;
            });
        };

        const extractSections = (raw: string) => {
            const blocks = raw.split(/(?=^##\s+)/m).map(s => s.trim()).filter(Boolean);
            return blocks.map((block) => {
                const m = block.match(/^##\s+(.+)$/m);
                const title = m ? normalizeInlineMarkdown(m[1]) : "Contenu";
                const content = m ? block.slice(m[0].length).trim() : block;
                return { title, content };
            });
        };

        const drawMarkdownTable = (tableLines: string[]) => {
            const rows = tableLines
                .map(l => l.trim())
                .filter(Boolean)
                .map(l => l.replace(/^\|/, "").replace(/\|$/, ""))
                .map(l => l.split("|").map(c => normalizeInlineMarkdown(c)))
                .filter(cells => cells.some(cell => cell.length > 0))
                .filter(cells => !cells.every(cell => /^:?-{3,}:?$/.test(cell)));

            if (rows.length === 0) return;

            const head = [rows[0]];
            const body = rows.slice(1);
            autoTable(doc, {
                startY: currentY,
                head,
                body,
                theme: "grid",
                margin: { left: margin, right: margin },
                styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2.5, overflow: "linebreak" },
                headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: "bold" },
            });
            currentY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
                ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
                : currentY + 8;
        };

        // Titre impératif
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Évaluation du Business Plan", pageWidth / 2, currentY, { align: "center" });
        currentY += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        writeParagraph(`Projet : ${businessPlanData.projectTitle || "N/A"}`, 5.5);
        currentY += 2;

        const sections = extractSections(reportContent);
        const sourceSections = sections.length > 0
            ? sections
            : [{ title: "Rapport d'évaluation", content: reportContent }];

        sourceSections.forEach(({ title, content }) => {
            ensurePage(10);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            writeParagraph(title, 6);
            currentY += 1;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            const lines = content.split("\n");
            let pendingTable: string[] = [];

            const flushTable = () => {
                if (pendingTable.length > 0) {
                    drawMarkdownTable(pendingTable);
                    pendingTable = [];
                }
            };

            lines.forEach((rawLine) => {
                const line = rawLine.trim();
                if (!line) {
                    flushTable();
                    currentY += 2;
                    return;
                }

                if (line.includes("|")) {
                    pendingTable.push(line);
                    return;
                }

                flushTable();
                writeParagraph(line);
            });

            flushTable();
            currentY += 4;
        });

        const safeProjectName = (businessPlanData.projectTitle || "Projet")
            .trim()
            .replace(/[^\w\-]+/g, "_");
        doc.save(`Evaluation_Business_${safeProjectName}.pdf`);
    };

    return (
        <>
            {/* ── Trigger Button ── */}
            <Button
                type="button"
                onClick={handleAudit}
                disabled={isLoading}
                className="gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <BarChart2 className="h-4 w-4" />
                )}
                {isLoading ? "Analyse en cours..." : "Évaluation du Business Plan"}
            </Button>

            {/* ── Result Dialog ── */}
            <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) setIsOpen(open); }}>
                <DialogContent className="w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-visible">
                    {/* Header */}
                    <DialogHeader className="px-4 sm:px-5 pt-4 pb-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md">
                                <BarChart2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold">Évaluation du Business Plan</DialogTitle>
                                <DialogDescription className="text-xs mt-0.5">
                                    Analyse des ratios sur toute la projection · Ajustements chiffrés · Décision crédit
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto overflow-x-visible px-4 sm:px-5 py-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <div className="relative">
                                    <div className="h-14 w-14 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />
                                    <BrainCircuit className="h-6 w-6 text-violet-500 absolute inset-0 m-auto" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-foreground">Analyse en cours...</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        L'auditeur IA examine l'ensemble de votre dossier
                                    </p>
                                </div>
                            </div>
                        ) : report ? (
                            <AuditReport text={report} />
                        ) : null}
                    </div>

                    {/* Footer */}
                    {!isLoading && report && (
                        <div className="px-4 sm:px-5 py-3 border-t flex justify-between items-center bg-muted/30 flex-shrink-0">
                            <p className="text-xs text-muted-foreground italic">
                                Rapport généré par IA · À valider avec un conseiller ANETI
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => report && generateProfessionalPDF(report)}
                                    className="gap-2 bg-white hover:bg-violet-50 border-violet-200 text-violet-700"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Télécharger
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="gap-2">
                                    <X className="h-3.5 w-3.5" />
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
