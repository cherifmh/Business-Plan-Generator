import { aiManager } from "@/lib/ai/manager";
import {
  SELECTABLE_AMORTIZATION_CATEGORIES,
  getAmortizationCategory,
} from "@/data/amortizationCategories";

/**
 * Classification automatique d'un équipement dans le barème du
 * Décret n° 2008-492 du 25 février 2008.
 *
 * Stratégie :
 * 1. Si un moteur IA est disponible (configuré via « Mode Expert »), on lui
 *    demande uniquement un identifiant de catégorie, en JSON strict.
 * 2. Sinon, ou si la réponse est inexploitable, un classifieur local par
 *    mots-clés propose une catégorie. Il fonctionne hors ligne et sans quota.
 *
 * Le résultat n'est jamais définitif : l'utilisateur peut toujours choisir
 * une autre catégorie dans le sélecteur.
 */

export type EquipmentClassificationSource = "ai" | "heuristic";

export interface EquipmentClassification {
  categoryId: string;
  source: EquipmentClassificationSource;
  confidence: number;
}

/* ───────────────────────────── Classifieur local ───────────────────────────── */

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Réduit un mot à sa racine approximative (pluriels simples). */
const stem = (word: string): string =>
  word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;

const containsKeyword = (words: string[], keyword: string): boolean => {
  const keywordWords = normalizeText(keyword).split(" ").filter(Boolean);
  if (keywordWords.length === 0) return false;
  const stems = words.map(stem);
  const keywordStems = keywordWords.map(stem);

  for (let start = 0; start <= stems.length - keywordStems.length; start++) {
    let matched = true;
    for (let offset = 0; offset < keywordStems.length; offset++) {
      if (stems[start + offset] !== keywordStems[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
};

/**
 * Règles ordonnées : la première correspondance l'emporte. Les termes les plus
 * spécifiques sont placés avant les termes génériques (« machine à laver »
 * avant « machine »).
 */
const LOCAL_RULES: Array<{ categoryId: string; keywords: string[] }> = [
  {
    categoryId: "IV.1.g",
    keywords: [
      "ordinateur", "pc", "laptop", "portable", "serveur", "imprimante", "scanner",
      "logiciel", "ecran", "moniteur", "clavier", "souris", "routeur", "switch",
      "reseau", "photocopieur", "copieur", "onduleur", "tablette", "gps",
      "caisse enregistreuse", "terminal de paiement", "tpe", "video projecteur",
      "projecteur", "nas", "disque dur", "camera de surveillance",
    ],
  },
  { categoryId: "V.2", keywords: ["vaisselle", "assiette", "couvert", "verre", "tasse"] },
  { categoryId: "V.4", keywords: ["linge", "draps", "serviette", "lingerie"] },
  { categoryId: "V.3", keywords: ["tapis", "rideau", "decor", "decoration", "lustre"] },
  { categoryId: "V.5", keywords: ["chaise longue", "parasol", "transat"] },
  {
    categoryId: "V.1",
    keywords: [
      "cuisine", "cuisinier", "four", "friteuse", "hotte", "plancha", "laverie",
      "buanderie", "machine a laver", "seche linge", "lave vaisselle", "marmite",
    ],
  },
  {
    categoryId: "IV.1.c",
    keywords: [
      "frigo", "refrigerateur", "congelateur", "chambre froide", "climatiseur",
      "climatisation", "chauffage", "chaudiere", "vitrine refrigeree",
    ],
  },
  { categoryId: "IV.1.d", keywords: ["ascenseur", "monte charge", "escalier mecanique"] },
  { categoryId: "IV.1.e", keywords: ["silo", "bac de stockage", "cuve de stockage"] },
  { categoryId: "IV.1.i", keywords: ["rayonnage", "rack", "racking", "palettier"] },
  { categoryId: "IV.1.j", keywords: ["conteneur", "container"] },
  { categoryId: "IV.1.k", keywords: ["citerne", "fut", "tonneau", "bidon"] },
  {
    categoryId: "IV.1.h",
    keywords: [
      "mobilier", "bureau", "chaise", "table", "armoire", "etagere", "meuble",
      "fauteuil", "banc", "placard", "comptoir", "cloison",
    ],
  },
  {
    categoryId: "IV.5.a",
    keywords: [
      "vehicule", "voiture", "camion", "camionnette", "fourgon", "moto", "scooter",
      "bus", "autocar", "remorque", "pick up", "tracteur routier", "utilitaire",
    ],
  },
  {
    categoryId: "IV.6.a",
    keywords: [
      "bulldozer", "betonniere", "pelle", "excavatrice", "grue", "compacteur",
      "dumper", "foreuse", "pervibrateur", "treuil", "polisseuse", "travaux publics",
      "chantier", "engin",
    ],
  },
  {
    categoryId: "IV.1.a",
    keywords: [
      "machine", "materiel industriel", "equipement industriel", "presse",
      "compresseur", "convoyeur", "ligne de production", "production", "usine",
      "tour", "fraiseuse", "perceuse", "poste a souder", "soudure", "moulin",
      "broyeur", "malaxeur", "extrudeuse", "injection", "automate", "robot",
    ],
  },
  {
    categoryId: "IV.7.a",
    keywords: ["transformateur", "poste de transformation", "ligne electrique", "compteur electrique"],
  },
  { categoryId: "IV.4.a", keywords: ["bateau", "navire", "yacht", "embarcation"] },
  { categoryId: "IV.3.a", keywords: ["avion", "aircraft"] },
  { categoryId: "IV.2.a", keywords: ["locomotive", "wagon", "train"] },
  { categoryId: "III.1", keywords: ["construction legere", "hangar", "kiosque", "abri"] },
  {
    categoryId: "III.2",
    keywords: [
      "construction", "batiment", "local", "immobilier", "amenagement",
      "amenagements", "travaux", "renovation", "extension",
    ],
  },
  { categoryId: "II.1", keywords: ["brevet", "marque", "developpement"] },
  {
    categoryId: "I.1",
    keywords: [
      "frais preliminaire", "frais d etablissement", "frais de constitution",
      "etude de marche", "licence", "autorisation",
    ],
  },
  { categoryId: "VI.1", keywords: ["tracteur agricole"] },
  { categoryId: "VI.2", keywords: ["materiel agricole", "motoculteur", "charru", "moissonneuse", "semoir"] },
  { categoryId: "VI.3", keywords: ["animal", "vache", "chevre", "mouton", "poulet", "cheptel", "ruche"] },
  { categoryId: "VI.4.a", keywords: ["olivier"] },
  { categoryId: "VI.4.e", keywords: ["agrume", "oranger", "citronnier"] },
  { categoryId: "VI.4.d", keywords: ["palmier"] },
  { categoryId: "VI.6", keywords: ["puits"] },
  { categoryId: "VI.7", keywords: ["arrosage", "goutte a goutte", "irrigation", "pompe agricole"] },
];

const VALID_CATEGORY_IDS = new Set(
  SELECTABLE_AMORTIZATION_CATEGORIES.map((category) => category.id)
);

/** Classification purement locale, sans appel réseau. */
export const classifyEquipmentLocally = (
  name: string
): EquipmentClassification | null => {
  const words = normalizeText(name).split(" ").filter(Boolean);
  if (words.length === 0) return null;

  for (const rule of LOCAL_RULES) {
    if (!VALID_CATEGORY_IDS.has(rule.categoryId)) continue;
    if (rule.keywords.some((keyword) => containsKeyword(words, keyword))) {
      return { categoryId: rule.categoryId, source: "heuristic", confidence: 0.7 };
    }
  }
  return null;
};

/* ─────────────────────────────── Classifieur IA ─────────────────────────────── */

const AI_SYSTEM_INSTRUCTION = [
  "Tu es un expert-comptable tunisien chargé de classer une immobilisation dans le barème du Décret n° 2008-492 du 25 février 2008.",
  "Réponds UNIQUEMENT par un objet JSON de la forme {\"categoryId\":\"IV.1.g\"}.",
  "N'invente aucun identifiant : utilise exclusivement la liste fournie.",
  "Si aucune catégorie ne correspond, réponds {\"categoryId\":null}.",
].join("\n");

const CATEGORY_PROMPT_LIST = SELECTABLE_AMORTIZATION_CATEGORIES.map(
  (category) => `- ${category.id} : ${category.label} (taux max ${category.rate} %)`
).join("\n");

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findCategoryIdInText = (text: string): string | null => {
  // Identifiants les plus longs d'abord pour éviter « IV.1.a » dans « IV.1.a.b ».
  const sorted = [...SELECTABLE_AMORTIZATION_CATEGORIES].sort(
    (a, b) => b.id.length - a.id.length
  );

  for (const category of sorted) {
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(category.id)}([^a-z0-9]|$)`,
      "i"
    );
    if (pattern.test(text)) return category.id;
  }

  // Repli : libellé complet renvoyé par le modèle.
  const normalized = normalizeText(text);
  for (const category of sorted) {
    if (normalized.includes(normalizeText(category.label))) return category.id;
  }

  return null;
};

const parseAiCategory = (response: string): string | null => {
  const start = response.indexOf("{");
  const end = response.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(response.slice(start, end + 1)) as Record<string, unknown>;
      const raw =
        parsed.categoryId ?? parsed.categorie ?? parsed.category ?? parsed.id ?? null;
      if (raw === null || raw === undefined) return null;
      const category = getAmortizationCategory(String(raw));
      if (category) return category.id;
    } catch {
      // Réponse non JSON : on tente l'extraction ci-dessous.
    }
  }
  return findCategoryIdInText(response);
};

const classifyWithAI = async (
  name: string
): Promise<EquipmentClassification | null> => {
  if (!aiManager.isReady()) return null;

  const prompt = [
    `Équipement ou immobilisation à classer : « ${name} »`,
    "",
    "Catégories autorisées (identifiant : libellé — taux maximum) :",
    CATEGORY_PROMPT_LIST,
    "",
    'Réponds uniquement avec le JSON : {"categoryId":"..."}',
  ].join("\n");

  const response = await aiManager.generateSection(prompt, {
    maxTokens: 120,
    temperature: 0,
    systemInstruction: AI_SYSTEM_INSTRUCTION,
  });

  const categoryId = parseAiCategory(response);
  if (!categoryId) return null;

  return { categoryId, source: "ai", confidence: 0.9 };
};

/* ────────────────────────────────── API ────────────────────────────────── */

/**
 * Au-delà de ce délai, on n'attend plus l'IA : la classification locale prend
 * le relais pour ne pas bloquer la saisie. Puter.js peut ouvrir une fenêtre
 * d'authentification, d'où un contrôle de session préalable.
 */
const AI_TIMEOUT_MS = 6000;
const PUTER_AUTH_TIMEOUT_MS = 1500;

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });

const isPuterSignedIn = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  const puter = (
    window as unknown as {
      puter?: { auth?: { isSignedIn?: () => boolean | Promise<boolean> } };
    }
  ).puter;
  if (!puter?.auth?.isSignedIn) return false;
  try {
    const value = puter.auth.isSignedIn();
    if (typeof value === "boolean") return value;
    return await withTimeout(Promise.resolve(value), PUTER_AUTH_TIMEOUT_MS, false);
  } catch {
    return false;
  }
};

const classificationCache = new Map<string, EquipmentClassification | null>();

/**
 * Détecte la catégorie d'un équipement. Utilise l'IA si un moteur est prêt,
 * sinon le classifieur local. Le résultat est mis en cache par libellé.
 */
export const classifyEquipment = async (
  name: string
): Promise<EquipmentClassification | null> => {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const cacheKey = normalizeText(trimmed);
  if (classificationCache.has(cacheKey)) {
    return classificationCache.get(cacheKey) ?? null;
  }

  let result: EquipmentClassification | null = null;

  if (aiManager.isReady()) {
    // Puter.js est « prêt » dès que son script est chargé, même sans session.
    // On évite de déclencher une fenêtre de connexion en arrière-plan.
    const providerId = aiManager.getProviderId();
    const canUseAi = providerId !== "puter" || (await isPuterSignedIn());

    if (canUseAi) {
      result = await withTimeout(
        (async () => {
          try {
            return await classifyWithAI(trimmed);
          } catch (error) {
            console.warn("[Classification IA] Échec, repli local :", error);
            return null;
          }
        })(),
        AI_TIMEOUT_MS,
        null
      );
    }
  }

  if (!result) result = classifyEquipmentLocally(trimmed);

  // Cache uniquement les résultats exploitables : un nom inconnu doit pouvoir
  // être reclassé après correction du libellé par l'utilisateur.
  if (result) classificationCache.set(cacheKey, result);
  return result;
};

/** Vide le cache (utile si le fournisseur IA change). */
export const clearEquipmentClassificationCache = (): void => {
  classificationCache.clear();
};
