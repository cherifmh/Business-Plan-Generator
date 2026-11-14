/**
 * Barème d'amortissement linéaire — Décret n° 2008-492 du 25 février 2008.
 *
 * Le décret fixe les TAUX MAXIMUM des amortissements linéaires (article 1er).
 * La durée d'amortissement en découle : durée = 100 / taux.
 *
 * Les lignes « grosses réparations » figurent dans le barème pour être
 * exhaustif, mais elles ne sont pas proposées dans le sélecteur : ce ne sont
 * pas des immobilisations achetées par l'entreprise.
 */

export type AmortizationGroup = "I" | "II" | "III" | "IV" | "V" | "VI" | "SPECIAL";

export interface AmortizationCategory {
  /** Identifiant du décret (ex. « IV.1.g »). */
  id: string;
  label: string;
  group: AmortizationGroup;
  /** Taux maximum d'amortissement linéaire, en pourcentage. */
  rate: number;
  /** Ligne « grosses réparations » : exclue du sélecteur d'équipements. */
  repair?: boolean;
}

export const AMORTIZATION_DECREE =
  "Décret n° 2008-492 du 25 février 2008";

export const AMORTIZATION_GROUP_LABELS: Record<AmortizationGroup, string> = {
  I: "I. Frais préliminaires",
  II: "II. Brevets, marques et actifs incorporels",
  III: "III. Constructions",
  IV: "IV. Machines, matériels et équipements",
  V: "V. Hôtellerie et restauration",
  VI: "VI. Agriculture",
  SPECIAL: "Cas particulier",
};

export const AMORTIZATION_CATEGORIES: AmortizationCategory[] = [
  // I. Frais préliminaires
  { id: "I.1", label: "Frais préliminaires", group: "I", rate: 100 },

  // II. Brevets, marques de fabrique et frais de développement capitalisés
  {
    id: "II.1",
    label: "Brevets, marques de fabrique et frais de développement capitalisés",
    group: "II",
    rate: 20,
  },

  // III. Constructions à l'exception de la valeur du terrain
  { id: "III.1", label: "Constructions légères", group: "III", rate: 10 },
  { id: "III.2", label: "Constructions en dur", group: "III", rate: 5 },
  { id: "III.3", label: "Autoroutes, ponts et échangeurs", group: "III", rate: 2.5 },
  { id: "III.4", label: "Glissières de sécurité pour autoroutes", group: "III", rate: 12.5 },
  { id: "III.5", label: "Signalisations verticales pour autoroutes", group: "III", rate: 12.5 },
  {
    id: "III.6",
    label: "Grosses réparations des autoroutes, ponts et échangeurs",
    group: "III",
    rate: 12.5,
    repair: true,
  },
  { id: "III.7", label: "Pistes pour avions", group: "III", rate: 5 },
  { id: "III.8", label: "Quais portuaires", group: "III", rate: 5 },
  { id: "III.9", label: "Voies ferrées", group: "III", rate: 5 },
  { id: "III.10", label: "Signalisations des voies ferrées", group: "III", rate: 5 },
  { id: "III.11", label: "Réseaux et canalisations", group: "III", rate: 5 },
  {
    id: "III.12",
    label: "Grosses réparations des constructions (légères, en dur, pistes, quais, voies ferrées, réseaux)",
    group: "III",
    rate: 15,
    repair: true,
  },
  { id: "III.13", label: "Parkings non couverts", group: "III", rate: 10 },
  { id: "III.14", label: "Courts de tennis", group: "III", rate: 10 },
  { id: "III.15", label: "Piscines", group: "III", rate: 10 },
  {
    id: "III.16",
    label: "Grosses réparations des parkings, courts de tennis et piscines",
    group: "III",
    rate: 25,
    repair: true,
  },

  // IV. Machines, matériels et équipements
  { id: "IV.1.a", label: "Machines, matériels et équipements industriels", group: "IV", rate: 15 },
  {
    id: "IV.1.b",
    label: "Grosses réparations des machines, matériels et équipements industriels",
    group: "IV",
    rate: 33.33,
    repair: true,
  },
  {
    id: "IV.1.c",
    label: "Machines et équipements de chauffage et frigorifiques",
    group: "IV",
    rate: 10,
  },
  {
    id: "IV.1.d",
    label: "Ascenseurs, monte-charges et escaliers mécaniques",
    group: "IV",
    rate: 10,
  },
  { id: "IV.1.e", label: "Silos et bacs de stockage", group: "IV", rate: 10 },
  {
    id: "IV.1.f",
    label: "Grosses réparations des équipements de chauffage/froid, ascenseurs, silos",
    group: "IV",
    rate: 25,
    repair: true,
  },
  {
    id: "IV.1.g",
    label: "Équipements et logiciels informatiques",
    group: "IV",
    rate: 33.33,
  },
  { id: "IV.1.h", label: "Mobilier et matériel de bureau", group: "IV", rate: 20 },
  { id: "IV.1.i", label: "Rayonnages métalliques", group: "IV", rate: 15 },
  { id: "IV.1.j", label: "Conteneurs", group: "IV", rate: 10 },
  { id: "IV.1.k", label: "Citernes et fûts", group: "IV", rate: 20 },
  {
    id: "IV.1.l",
    label: "Autres machines, matériels et équipements",
    group: "IV",
    rate: 15,
  },

  { id: "IV.2.a", label: "Wagons et locomotives", group: "IV", rate: 5 },
  { id: "IV.2.b", label: "Wagons de transport de marchandises", group: "IV", rate: 3.33 },
  {
    id: "IV.2.c",
    label: "Wagons techniques pour le contrôle des voies ferrées",
    group: "IV",
    rate: 6.67,
  },
  {
    id: "IV.2.d",
    label: "Grosses réparations des moyens de transport ferroviaire",
    group: "IV",
    rate: 12.5,
    repair: true,
  },

  { id: "IV.3.a", label: "Partie fixe des avions et leurs moteurs", group: "IV", rate: 5.56 },
  { id: "IV.3.b", label: "Grosses réparations des avions", group: "IV", rate: 20, repair: true },
  {
    id: "IV.3.c",
    label: "Grosses réparations des moteurs des avions",
    group: "IV",
    rate: 33.33,
    repair: true,
  },

  { id: "IV.4.a", label: "Bateaux et navires", group: "IV", rate: 6.25 },
  {
    id: "IV.4.b",
    label: "Grosses réparations des bateaux et navires",
    group: "IV",
    rate: 20,
    repair: true,
  },
  {
    id: "IV.4.c",
    label: "Grosses réparations des moteurs des bateaux et navires",
    group: "IV",
    rate: 33.33,
    repair: true,
  },

  {
    id: "IV.5.a",
    label: "Moyens de transport des personnes ou de marchandises",
    group: "IV",
    rate: 20,
  },
  {
    id: "IV.5.b",
    label: "Grosses réparations des moyens de transport terrestre",
    group: "IV",
    rate: 33.33,
    repair: true,
  },

  {
    id: "IV.6.a",
    label: "Machines et matériels des travaux publics et de bâtiment (bulldozer, bétonnière, foreuse, camion dumper, pervibrateur, treuil, polisseuse, compacteur…)",
    group: "IV",
    rate: 20,
  },
  {
    id: "IV.6.b",
    label: "Grosses réparations des machines et matériels des travaux publics et de bâtiment",
    group: "IV",
    rate: 33.33,
    repair: true,
  },

  {
    id: "IV.7.a",
    label: "Équipements de production, de transport et de distribution de l'électricité",
    group: "IV",
    rate: 5,
  },
  {
    id: "IV.7.b",
    label: "Équipements de transport et de distribution du gaz",
    group: "IV",
    rate: 5,
  },
  {
    id: "IV.7.c",
    label: "Grosses réparations des équipements de l'électricité et du gaz",
    group: "IV",
    rate: 15,
    repair: true,
  },

  // V. Hôtellerie et restauration
  { id: "V.1", label: "Matériels de cuisine et buanderie", group: "V", rate: 20 },
  { id: "V.2", label: "Vaissellerie", group: "V", rate: 100 },
  {
    id: "V.3",
    label: "Tapis, rideaux, éléments et aménagements décoratifs",
    group: "V",
    rate: 20,
  },
  { id: "V.4", label: "Lingerie", group: "V", rate: 33.33 },
  {
    id: "V.5",
    label: "Accessoires de piscines (chaises longues, parasols…)",
    group: "V",
    rate: 20,
  },

  // VI. Agriculture
  {
    id: "VI.1",
    label: "Tracteurs agricoles et matériels roulants autotractés",
    group: "VI",
    rate: 20,
  },
  { id: "VI.2", label: "Autres machines et matériels agricoles", group: "VI", rate: 15 },
  { id: "VI.3", label: "Animaux de production et animaux de services", group: "VI", rate: 20 },
  {
    id: "VI.4.a",
    label: "Plantations — oliviers pour l'extraction d'huile",
    group: "VI",
    rate: 3.33,
  },
  { id: "VI.4.b", label: "Plantations — oliviers de table", group: "VI", rate: 5 },
  { id: "VI.4.c", label: "Plantations — vignes", group: "VI", rate: 3.33 },
  { id: "VI.4.d", label: "Plantations — palmiers", group: "VI", rate: 3.33 },
  { id: "VI.4.e", label: "Plantations — agrumes", group: "VI", rate: 5 },
  { id: "VI.4.f", label: "Plantations — amandiers", group: "VI", rate: 5 },
  { id: "VI.4.g", label: "Plantations — autres plantations", group: "VI", rate: 6.66 },
  {
    id: "VI.5",
    label: "Travaux de conservation des eaux et du sol",
    group: "VI",
    rate: 20,
  },
  { id: "VI.6", label: "Puits", group: "VI", rate: 10 },
  { id: "VI.7", label: "Équipements d'arrosage", group: "VI", rate: 20 },

  // Cas particulier — article 4 du décret
  {
    id: "SPECIAL.1",
    label: "Bien de faible valeur (moins de 200 TND) — amortissement intégral",
    group: "SPECIAL",
    rate: 100,
  },
];

/** Catégories proposées à l'utilisateur (hors lignes « grosses réparations »). */
export const SELECTABLE_AMORTIZATION_CATEGORIES = AMORTIZATION_CATEGORIES.filter(
  (category) => !category.repair
);

const normalizeCategoryKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const CATEGORY_BY_ID = new Map<string, AmortizationCategory>();
const CATEGORY_BY_LABEL = new Map<string, AmortizationCategory>();

for (const category of AMORTIZATION_CATEGORIES) {
  CATEGORY_BY_ID.set(normalizeCategoryKey(category.id), category);
  const labelKey = normalizeCategoryKey(category.label);
  if (!CATEGORY_BY_LABEL.has(labelKey)) CATEGORY_BY_LABEL.set(labelKey, category);
}

/**
 * Retrouve une catégorie par son identifiant (« IV.1.g ») ou, à défaut, par son
 * libellé exact (utile pour les imports et les réponses d'IA).
 */
export const getAmortizationCategory = (
  value?: string | null
): AmortizationCategory | undefined => {
  if (!value) return undefined;
  const key = normalizeCategoryKey(value);
  if (!key) return undefined;
  return CATEGORY_BY_ID.get(key) ?? CATEGORY_BY_LABEL.get(key);
};

export const isKnownAmortizationCategory = (value?: string | null): boolean =>
  !!getAmortizationCategory(value);

const roundTo = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** Durée (années) correspondant à un taux maximum : 100 / taux. */
export const durationFromRate = (rate?: number): number =>
  rate && rate > 0 ? roundTo(100 / rate, 4) : 0;

/** Taux (%) correspondant à une durée en années : 100 / durée. */
export const rateFromDuration = (duration?: number): number =>
  duration && duration > 0 ? roundTo(100 / duration, 4) : 0;

/** Taux réellement appliqué : taux explicite, sinon déduit de la durée. */
export const effectiveAmortizationRate = (item: {
  duration?: number;
  amortizationRate?: number;
}): number =>
  item.amortizationRate && item.amortizationRate > 0
    ? item.amortizationRate
    : rateFromDuration(item.duration);

/** Durée réellement appliquée (peut être décimale, ex. 6,67 ans pour 15 %). */
export const effectiveAmortizationDuration = (item: {
  duration?: number;
  amortizationRate?: number;
}): number => {
  const rate = effectiveAmortizationRate(item);
  return rate > 0 ? durationFromRate(rate) : 0;
};

/**
 * Dotation annuelle linéaire d'une immobilisation.
 * - taux explicite (catégorie du décret) : base × taux / 100 ;
 * - sinon ancien comportement : base / durée.
 */
export const annualAmortizationAmount = (
  base: number,
  item: { duration?: number; amortizationRate?: number }
): number => {
  if (!Number.isFinite(base) || base <= 0) return 0;
  if (item.amortizationRate && item.amortizationRate > 0) {
    return (base * item.amortizationRate) / 100;
  }
  return item.duration && item.duration > 0 ? base / item.duration : 0;
};

/** Formate un taux pour l'affichage : 33,33 %. */
export const formatRate = (rate?: number): string => {
  if (!rate || rate <= 0) return "—";
  return `${rate.toLocaleString("fr-TN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} %`;
};

/** Formate une durée pour l'affichage : 6,67 ans. */
export const formatDuration = (duration?: number): string => {
  if (!duration || duration <= 0) return "—";
  return `${duration.toLocaleString("fr-TN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ans`;
};
