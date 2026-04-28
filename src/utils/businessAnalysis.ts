import type { BusinessPlanData } from "@/types/businessPlan";

export type BusinessProfile = {
  sector: NonNullable<BusinessPlanData["projectSector"]>;
  activity_type: NonNullable<BusinessPlanData["activityType"]>;
  revenue_model: NonNullable<BusinessPlanData["revenueModel"]>;
  sales_channel: NonNullable<BusinessPlanData["salesChannel"]>;
  customer_type: NonNullable<BusinessPlanData["customerType"]>;
};

export type DerivedAttributes = {
  digital: boolean;
  recurring_revenue: boolean;
  scalable: "faible" | "moyen" | "élevé";
  capex: "faible" | "moyen" | "élevé";
  operational_complexity: "faible" | "moyen" | "élevé";
};

export function buildBusinessProfile(data: BusinessPlanData): BusinessProfile | null {
  if (!data.projectSector || !data.activityType || !data.revenueModel || !data.salesChannel || !data.customerType) return null;
  return {
    sector: data.projectSector,
    activity_type: data.activityType,
    revenue_model: data.revenueModel,
    sales_channel: data.salesChannel,
    customer_type: data.customerType,
  };
}

export function deriveAttributes(profile: BusinessProfile): DerivedAttributes {
  const digital = profile.activity_type === "Activité digitale" || profile.sales_channel === "En ligne";
  const recurring_revenue = profile.revenue_model === "Abonnement";

  const scalable: DerivedAttributes["scalable"] =
    digital ? "élevé" : profile.sector === "Industrie" ? "moyen" : "faible";

  const capex: DerivedAttributes["capex"] =
    profile.sector === "Industrie" ? "élevé" : profile.sector === "Commerce" ? "moyen" : "faible";

  const operational_complexity: DerivedAttributes["operational_complexity"] =
    profile.sector === "Industrie" ? "élevé" : profile.sector === "Services" ? "moyen" : "faible";

  return { digital, recurring_revenue, scalable, capex, operational_complexity };
}

export function getCosts(sector: BusinessProfile["sector"], activityType: BusinessProfile["activity_type"]): string[] {
  // activityType kept for future refinement (deterministic extension)
  switch (sector) {
    case "Commerce":
      return ["stock", "logistique", "local"];
    case "Industrie":
      return ["machines", "matières premières", "main d'œuvre"];
    case "Services":
      return ["salaires", "marketing"];
    case "Agriculture":
      return ["intrants", "équipement", "saisonnalité"];
    case "Artisanat":
      return ["matières", "temps de production"];
    case "Freelance":
      return ["temps", "outils"];
    case "Startup":
      return ["développement", "marketing", "acquisition"];
    default:
      return ["coûts à préciser"];
  }
}

export function getRevenueLogic(revenueModel: BusinessProfile["revenue_model"]): string {
  switch (revenueModel) {
    case "Vente ponctuelle":
      return "revenus non récurrents";
    case "Abonnement":
      return "revenus récurrents";
    case "Commission":
      return "revenus proportionnels";
    case "Mixte":
      return "revenus hybrides";
    default:
      return "revenus à préciser";
  }
}

export function getRisks(sector: BusinessProfile["sector"]): string[] {
  switch (sector) {
    case "Commerce":
      return ["invendus", "fournisseurs"];
    case "Industrie":
      return ["coûts fixes", "pannes"];
    case "Services":
      return ["dépendance humaine"];
    case "Agriculture":
      return ["climat", "rendement"];
    case "Artisanat":
      return ["capacité de production", "dépendance au temps"];
    case "Freelance":
      return ["instabilité revenus"];
    case "Startup":
      return ["incertitude marché"];
    default:
      return ["risques à préciser"];
  }
}

export function generateAnalysis(data: BusinessPlanData) {
  const profile = buildBusinessProfile(data);
  if (!profile) {
    return null;
  }

  const attributes = deriveAttributes(profile);
  const costs = getCosts(profile.sector, profile.activity_type);
  const revenue_logic = getRevenueLogic(profile.revenue_model);
  const risks = getRisks(profile.sector);

  const warnings: string[] = [];
  if (attributes.capex === "élevé" && revenue_logic === "revenus non récurrents") {
    warnings.push("⚠️ CAPEX élevé + revenus non récurrents : risque financier (tension de trésorerie et sensibilité au volume).");
  }
  if (profile.sector === "Freelance" && risks.includes("instabilité revenus")) {
    warnings.push("⚠️ Freelance : dépendance au portefeuille client et au temps disponible (fragilité du modèle).");
  }
  if (attributes.digital && !(data.marketingStrategy || "").trim()) {
    warnings.push("⚠️ Projet digital sans stratégie marketing : risque d’acquisition client faible.");
  }

  return {
    sector: profile.sector,
    profile,
    attributes,
    costs,
    revenue_logic,
    risks,
    scalability: attributes.scalable,
    warnings,
  };
}

