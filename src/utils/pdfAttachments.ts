import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFArray,
  PDFRef,
  PDFRawStream,
  PDFString,
  PDFHexString,
  decodePDFRawStream,
} from "pdf-lib";
import type { PDFObject } from "pdf-lib";
import type { BusinessPlanData } from "@/types/businessPlan";

/** Nom canonique de la pièce jointe JSON embarquée dans le PDF. */
export const ATTACHMENT_FILENAME = "plan-viable-data.json";

/**
 * Champs caractéristiques d'un BusinessPlanData.
 * Utilisés pour reconnaître un objet « projet » quelle que soit l'enveloppe
 * du fichier (compatibilité avec les anciens fichiers sauvegardés).
 */
const KNOWN_PROJECT_FIELDS = [
  "promoterName", "promoterCin", "promoterAddress", "promoterPhone", "promoterEmail",
  "scientificDiplomas", "professionalDiplomas", "experienceItems", "trainings",
  "projectTitle", "projectDescription", "projectLocation", "legalStructure",
  "projectSector", "projectNature", "projectAdvantages", "projectAuthorizations",
  "loanAmount", "loanDuration", "loanInterestRate",
  "equipments", "existingEquipments", "startupCosts", "workingCapital",
  "personalContribution", "grantAmount", "bankLoan", "investmentBreakdown",
  "marketStudy", "marketingStrategy", "productsDescription", "targetAudience",
  "rawMaterials", "personnel", "externalCharges", "products", "socialChargesRate",
  "turnoverGrowthRate", "expensesGrowthRate", "discountRate", "projectionYears",
  "cruiseYear", "includeYearZero", "strengths", "weaknesses", "opportunities",
  "threats", "conclusion", "editorAdvice",
];

/** Clés de métadonnées à retirer d'un objet projet nu. */
const META_KEYS = ["_meta", "version", "exportedAt", "auditReport", "data"];

/** Clés possibles pour une enveloppe contenant l'objet projet. */
const ENVELOPE_KEYS = ["data", "project", "businessPlan", "plan", "planDaAffaires", "payload"];

/** Format canonique du fichier de sauvegarde du projet. */
export interface SavedProjectFile {
  version: string;
  exportedAt: string;
  data: BusinessPlanData;
  auditReport: string | null;
}

/**
 * Décode un buffer texte en gérant les BOM UTF-8 / UTF-16 LE / UTF-16 BE.
 * Indispensable pour les fichiers JSON anciens réenregistrés par un
 * éditeur Windows (Notepad, Excel…) qui ajoutent un BOM.
 *
 * Le repli Windows-1252 est traite par `decodeJsonText`.
 */
export function decodeTextFile(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(bytes.subarray(3));
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  }

  return new TextDecoder("utf-8").decode(bytes);
}

/**
 * Décode un fichier JSON de projet, en ignorant les espaces parasites en tête
 * (certains éditeurs Windows en préfixent).
 *
 * Contrairement à `decodeTextFile`, le choix de l'encodement est validé : on ne
 * bascule en Windows-1252 que si le texte UTF-8 est inexploitable ET que le
 * texte obtenu est du JSON valide. Sans cette double condition, un fichier
 * UTF-8 authentique contenant U+FFFD resterait corrompu.
 */
export function decodeJsonText(buffer: ArrayBuffer): string {
  const utf8 = decodeTextFile(buffer);
  if (!utf8.includes("\uFFFD")) return utf8;

  const latin1 = new TextDecoder("windows-1252").decode(new Uint8Array(buffer));
  const parsable = (text: string) => {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  };
  return !parsable(utf8) && parsable(latin1) ? latin1 : utf8;
}

/** Sérialise un payload en bytes UTF-8 (JSON formaté). */
export function encodeJson(payload: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(payload, null, 2));
}

/**
 * Détecte un PDF par sa signature binaire « %PDF ».
 * Windows fournit souvent un type MIME vide ou trompeur : la signature est
 * le seul test fiable, et fonctionne même si le fichier a été renommé.
 */
export function isPdfBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

/**
 * Charge un PDF (bytes), attache le payload JSON sous ATTACHMENT_FILENAME
 * et retourne les bytes du PDF enrichi.
 * Lance une erreur si le PDF ne peut pas être chargé par pdf-lib.
 */
export async function embedJsonInPdf(
  pdfBytes: Uint8Array,
  jsonPayload: unknown
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  // `attach()` est asynchrone : l'écriture réelle est faite au flush() de save().
  await pdfDoc.attach(encodeJson(jsonPayload), ATTACHMENT_FILENAME, {
    mimeType: "application/json",
    description: "Données structurées du Plan Viable (rétro-ingénierie)",
  });
  return await pdfDoc.save();
}

/**
 * Extrait le contenu texte de la pièce jointe JSON embarquée dans un PDF.
 * Retourne null si aucune pièce jointe JSON n'est trouvée.
 *
 * pdf-lib n'expose pas de lecture des pièces jointes : on parcourt donc
 * l'arbre de noms /Catalog /Names /EmbeddedFiles (format PDF standard),
 * avec un repli sur les flux /Type /EmbeddedFile non référencés.
 */
export async function extractJsonFromPdf(pdfBytes: Uint8Array): Promise<string | null> {
  // Un PDF corrompu, tronque, chiffre ou simplement absent doit se traduire
  // par « aucune donnée embarquée » : le formulaire affiche un message clair
  // au lieu de laisser remonter une exception de analyse PDF.
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, throwOnInvalidObject: false });
  } catch (error) {
    console.warn("PDF illisible, aucune pièce jointe extraite :", error);
    return null;
  }

  const attachments = collectEmbeddedFiles(pdfDoc);
  if (attachments.size === 0) return null;

  const names = [...attachments.keys()];
  const preferred = names.find(
    (name) => name.toLowerCase() === ATTACHMENT_FILENAME.toLowerCase()
  );
  const jsonKey = preferred ?? names.find((name) => name.toLowerCase().endsWith(".json"));
  if (!jsonKey) return null;

  const bytes = attachments.get(jsonKey);
  if (!bytes) return null;
  try {
    return new TextDecoder().decode(bytes);
  } catch (error) {
    console.warn("Pièce jointe illisible :", error);
    return null;
  }
}

/** Résout une valeur éventuellement indirecte (PDFRef) via le contexte. */
function deref(
  context: { lookup: (ref: PDFRef) => PDFObject | undefined },
  obj: PDFObject | undefined
): PDFObject | undefined {
  return obj instanceof PDFRef ? context.lookup(obj) : obj;
}

/** Décode une chaîne PDF littérale (PDFString ou PDFHexString). */
function decodePdfText(obj: PDFObject | undefined): string | null {
  if (obj instanceof PDFString) return obj.decodeText();
  if (obj instanceof PDFHexString) return obj.decodeText();
  return null;
}

/** Lit les octets d'un dictionnaire /Filespec (via /EF /F). */
function readFileSpec(spec: PDFDict): Uint8Array | null {
  const context = spec.context;
  const ef = deref(context, spec.get(PDFName.of("EF")));
  if (!(ef instanceof PDFDict)) return null;

  const stream =
    deref(context, ef.get(PDFName.of("F"))) ?? deref(context, ef.get(PDFName.of("UF")));
  if (!(stream instanceof PDFRawStream)) return null;

  try {
    return decodePDFRawStream(stream).decode();
  } catch (error) {
    console.warn("Lecture du flux de la pièce jointe impossible :", error);
    return null;
  }
}

/** Collecte toutes les pièces jointes du document sous forme de Map<nom, octets>. */
function collectEmbeddedFiles(pdfDoc: PDFDocument): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  const context = pdfDoc.context;

  const namesDict = deref(context, pdfDoc.catalog.get(PDFName.of("Names")));
  const embeddedFiles =
    namesDict instanceof PDFDict
      ? deref(context, namesDict.get(PDFName.of("EmbeddedFiles")))
      : undefined;
  if (!(embeddedFiles instanceof PDFDict)) return files;

  // Parcours récursif de l'arbre de noms (gère /Names et /Kids).
  const walk = (node: PDFDict, depth: number): void => {
    if (depth > 32) return; // garde-fou

    const namesArray = deref(context, node.get(PDFName.of("Names")));
    if (namesArray instanceof PDFArray) {
      for (let i = 0; i + 1 < namesArray.size(); i += 2) {
        const spec = deref(context, namesArray.get(i + 1));
        if (!(spec instanceof PDFDict)) continue;
        const bytes = readFileSpec(spec);
        if (!bytes) continue;
        const name = decodePdfText(deref(context, namesArray.get(i)));
        files.set(name && name.length > 0 ? name : ATTACHMENT_FILENAME, bytes);
      }
    }

    const kids = deref(context, node.get(PDFName.of("Kids")));
    if (kids instanceof PDFArray) {
      for (let i = 0; i < kids.size(); i++) {
        const kid = deref(context, kids.get(i));
        if (kid instanceof PDFDict) walk(kid, depth + 1);
      }
    }
  };

  walk(embeddedFiles, 0);

  // Repli : PDF générés par d'autres outils, sans arbre de noms exploitable.
  if (files.size === 0) {
    for (const [, object] of context.enumerateIndirectObjects()) {
      if (
        object instanceof PDFRawStream &&
        String(object.dict.get(PDFName.of("Type"))) === "/EmbeddedFile"
      ) {
        try {
          files.set(ATTACHMENT_FILENAME, decodePDFRawStream(object).decode());
          break;
        } catch {
          /* flux illisible : on l'ignore */
        }
      }
    }
  }

  return files;
}

/**
 * Valide et normalise un texte JSON en SavedProjectFile.
 * Accepte tous les formats historiques (voir normalizeProjectPayload).
 * Le BOM éventuel est retiré avant l'analyse (fichiers réenregistrés par
 * un éditeur Windows) : sinon JSON.parse échoue sur un caractère invisible.
 */
export function parseProjectPayload(text: string): SavedProjectFile {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (cleaned.length === 0) {
    throw new Error("Le fichier est vide.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Fichier JSON invalide ou corrompu.");
  }
  return normalizeProjectPayload(parsed);
}

/** Nombre de champs connus de BusinessPlanData présents dans un objet. */
function countKnownFields(obj: Record<string, unknown>): number {
  let count = 0;
  for (const key of Object.keys(obj)) {
    if (KNOWN_PROJECT_FIELDS.includes(key)) count++;
  }
  return count;
}

/** True si la valeur est une chaîne non vide (ou un nombre lisible). */
function hasText(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Score de confiance « cet objet est un BusinessPlanData ».
 * Les deux champs d'identification (titre du projet, nom du promoteur)
 * pèsent lourd, chaque champ métier connu compte pour 1.
 */
function scoreProject(obj: Record<string, unknown>): number {
  let score = countKnownFields(obj);
  if (hasText(obj.projectTitle)) score += 2;
  if (hasText(obj.promoterName)) score += 2;
  return score;
}

/** Retire les clés de métadonnées d'un objet projet nu. */
function stripMetaKeys(source: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...source };
  for (const key of META_KEYS) delete clean[key];
  return clean;
}

/** Lit une métadonnée de version / date, quelle que soit sa forme. */
function readMeta(root: Record<string, unknown>, key: string, fallback: string): string {
  const direct = root[key];
  if (typeof direct === "string" && direct.length > 0) return direct;
  const meta = root._meta as Record<string, unknown> | undefined;
  const nested = meta ? meta[key] : undefined;
  if (typeof nested === "string" && nested.length > 0) return nested;
  return fallback;
}

/**
 * Normalise un objet déjà parsé en SavedProjectFile.
 *
 * Tolérant à tous les formats historiques :
 *  1. enveloppe    { version, exportedAt, data, auditReport }
 *  2. enveloppe alt. { project | businessPlan | plan | … : { … } }
 *  3. objet projet nu { …champs… }, avec ou sans métadonnées
 *
 * Un fichier ancien incomplet n'est jamais rejeté dès qu'il porte un seul
 * indice de projet (titre, promoteur ou champ métier connu) : les champs
 * manquants sont réinjectés par défaut au chargement.
 */
export function normalizeProjectPayload(parsed: unknown): SavedProjectFile {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Fichier JSON invalide ou corrompu.");
  }
  const root = parsed as Record<string, unknown>;
  const now = new Date().toISOString();
  const audit = typeof root.auditReport === "string" ? root.auditReport : null;
  const wrap = (project: Record<string, unknown>): SavedProjectFile => ({
    version: readMeta(root, "version", "1.0.0"),
    exportedAt: readMeta(root, "exportedAt", now),
    data: project as unknown as BusinessPlanData,
    auditReport: audit,
  });

  // 1 & 2) Enveloppe : on retient l'objet projet le plus crédible.
  let bestEnvelope: Record<string, unknown> | null = null;
  let bestEnvelopeScore = 0;
  for (const key of ENVELOPE_KEYS) {
    const inner = root[key];
    if (!inner || typeof inner !== "object" || Array.isArray(inner)) continue;
    const candidate = inner as Record<string, unknown>;
    const score = scoreProject(candidate);
    if (score > bestEnvelopeScore) {
      bestEnvelope = candidate;
      bestEnvelopeScore = score;
    }
  }
  if (bestEnvelope && bestEnvelopeScore >= 2) return wrap(bestEnvelope);

  // 3) Objet projet à la racine (avec ou sans métadonnées).
  const bare = stripMetaKeys(root);
  if (scoreProject(bare) >= 2) return wrap(bare);

  // 4) Repli tolérant : un seul indice suffit à accepter le fichier.
  if (bestEnvelope && bestEnvelopeScore >= 1) return wrap(bestEnvelope);
  if (countKnownFields(root) >= 1) {
    console.warn(
      "Import : projet partiel reconnu (champs détectés :",
      Object.keys(root).slice(0, 12).join(", "),
      ")"
    );
    return wrap(root);
  }

  console.warn(
    "Import : aucun champ BusinessPlanData détecté. Clés racine du fichier :",
    Object.keys(root).slice(0, 20).join(", ")
  );
  throw new Error("Schéma incompatible : ce fichier ne contient pas de données de projet.");
}

/** Déclenche le téléchargement d'un blob (bytes) dans le navigateur. */
export function downloadBytes(bytes: Uint8Array, filename: string, mime: string): void {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}