import type { BusinessPlanData } from "@/types/businessPlan";

/**
 * Normalisation des données de projet lors d'un import.
 *
 * PRINCIPES (application destined a des dossiers bancaires)
 * --------------------------------------------------------
 * 1. FIDELITE : aucune valeur presente dans le fichier n'est modifiee. On
 *    change uniquement la representations d'un meme nombre (« 80 000,50 »
 *    -> 80000.5), ce que fait deja le champ monetary de l'application.
 * 2. AUCUN CALCUL INDEPENDANT : l'import ne calcule ni CA, ni charges, ni
 *    amortissements. Ces valeurs sortent du seul moteur de l'application
 *    (financialCalculations). Le normaliseur ne fait que remettre les donnees
 *    dans la forme que ce moteur attend, afin qu'il ne produise pas NaN.
 * 3. AUCUNE INVENTION SILENCIEUSE : lorsqu'un champ manque dans le fichier, on
 *    applique la valeur par defaut que l'application applique elle-meme quand
 *    l'utilisateur ajoute une ligne (tvaRate 19 %, 12 mois travailles…), et
 *    cette substitution est signalee dans le rapport d'import.
 * 4. TRANSPARENCE : tout ce qui est renomme, complete, reclasse ou conserve
 *    tel quel est返回 dans `SanitizeReport`, affiche a l'utilisateur.
 *
 * Les fichiers enregistres par d'anciennes versions de l'application peuvent
 * presenter des cles de champs differentes (`designation` au lieu de `name`,
 * `etude de marche` au lieu de `marketStudy`), des nombres stockes en chaines,
 * des tableaux d'objets vides, ou `externalCharges` sous forme de tableau.
 */

/* ─────────────────────────── Utilitaires de base ─────────────────────────── */

/** Minuscules, sans accents ni separateurs : « Quantité Annuelle » -> « quantiteannuelle ». */
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Convertit en nombre : accepte « 12 000,50 », "1 500", true, null. */
function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/[\s\u00a0\u202f\u2007]/g, "").replace(",", ".");
    const direct = Number(cleaned);
    if (Number.isFinite(direct) && cleaned !== "") return direct;
    const digits = cleaned.replace(/[^0-9.-]/g, "");
    const extracted = Number(digits);
    if (digits !== "" && Number.isFinite(extracted)) return extracted;
  }
  return fallback;
}

/** Convertit en texte ; les nombres deviennent « 12000 ». */
function toText(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

/** Convertit en booleen : accepte « true », « oui », 1, « 0 ». */
function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "oui", "yes", "vrai", "on"].includes(v)) return true;
    if (["false", "0", "non", "no", "faux", "off", ""].includes(v)) return false;
  }
  return fallback;
}

/** Premiere cle presente dans un objet legacy. */
function pick(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

/* ───────────────── Alias des champs de premier niveau ────────────────────
   Redigees en clair puis normalisees au chargement. C'est ce table qui
   permet aux anciens fichiers — dont les champs texte avaient souvent des
   noms francais — de retrouver leur champ canonique.                        */

const FIELD_ALIASES: Record<string, string> = {
  // ── Promoteur : identite ──
  "nom du promoteur": "promoterName",
  "nom promoteur": "promoterName",
  prenomnom: "promoterName",
  promoteur: "promoterName",
  owner: "promoterName",
  "date de naissance": "promoterBirthDate",
  naissance: "promoterBirthDate",
  "lieu de naissance": "promoterBirthPlace",
  "cin": "promoterCin",
  "numero cin": "promoterCin",
  "carte identite": "promoterCin",
  "date de delivrance": "promoterCinDate",
  delivrancecin: "promoterCinDate",
  "niveau instruction": "promoterEducationLevel",
  "niveau d instruction": "promoterEducationLevel",
  instruction: "promoterEducationLevel",
  diplome: "promoterDiploma",
  "diplome principal": "promoterDiploma",
  "annee diplome": "promoterDiplomaYear",
  "annee d obtention": "promoterDiplomaYear",
  "situation familiale": "promoterMaritalStatus",
  "situation matrimoniale": "promoterMaritalStatus",
  "etat civil": "promoterMaritalStatus",
  "service militaire": "promoterMilitaryService",
  "statut militaire": "promoterMilitaryService",
  adresse: "promoterAddress",
  "adresse promoteur": "promoterAddress",
  residence: "promoterAddress",
  telephone: "promoterPhone",
  tel: "promoterPhone",
  phone: "promoterPhone",
  email: "promoterEmail",
  mail: "promoterEmail",
  courriel: "promoterEmail",
  logement: "promoterHousingStatus",
  "statut logement": "promoterHousingStatus",
  "fonction conjoint": "promoterSpouseFunction",
  "profession conjoint": "promoterSpouseFunction",
  "profession": "promoterSpouseFunction",
  fonction: "promoterSpouseFunction",
  "revenu conjoint": "promoterSpouseIncome",
  "salaire conjoint": "promoterSpouseIncome",
  age: "promoterAge",
  "age promoteur": "promoterAge",
  // ── Promoteur : qualifications et ressources ──
  qualification: "qualifications",
  diplomes: "qualifications",
  competences: "qualifications",
  "experience professionnelle": "experience",
  parcours: "experience",
  "annees experience": "experienceYears",
  "duree experience": "experienceYears",
  "fonction pere": "promoterFatherFunction",
  "profession pere": "promoterFatherFunction",
  "activite pere": "promoterFatherFunction",
  "revenu pere": "promoterFatherIncome",
  "salaire pere": "promoterFatherIncome",
  "fonction mere": "promoterMotherFunction",
  "profession mere": "promoterMotherFunction",
  "activite mere": "promoterMotherFunction",
  "revenu mere": "promoterMotherIncome",
  "salaire mere": "promoterMotherIncome",
  "autres ressources": "promoterOtherResources",
  "montant autres ressources": "promoterOtherResourcesAmount",
  "montant loyer": "promoterRentAmount",
  "autres charges": "promoterOtherCharges",
  "montant autres charges": "promoterOtherChargesAmount",
  garantie: "promoterGuarantee",
  garanties: "promoterGuarantee",
  // ── Projet ──
  titre: "projectTitle",
  "titre du projet": "projectTitle",
  "nom du projet": "projectTitle",
  "nom projet": "projectTitle",
  projet: "projectTitle",
  projectname: "projectTitle",
  description: "projectDescription",
  "description du projet": "projectDescription",
  "description activite": "projectDescription",
  "description de l activite": "projectDescription",
  localisation: "projectLocation",
  lieu: "projectLocation",
  "lieu implantation": "projectLocation",
  emplacement: "projectLocation",
  ville: "projectLocation",
  "adresse projet": "projectLocation",
  "forme juridique": "legalStructure",
  "structure juridique": "legalStructure",
  forme: "legalStructure",
  "statut juridique": "legalStructure",
  secteur: "projectSector",
  "secteur activite": "projectSector",
  "secteur d activite": "projectSector",
  "secteur economique": "projectSector",
  "type activite": "activityType",
  "nature activite": "activityType",
  "modele revenu": "revenueModel",
  "modele de revenus": "revenueModel",
  "source revenu": "revenueModel",
  "canal vente": "salesChannel",
  "canal de vente": "salesChannel",
  "canal distribution": "salesChannel",
  "canal de distribution": "salesChannel",
  nature: "projectNature",
  "nature projet": "projectNature",
  "nature du projet": "projectNature",
  "type projet": "projectNature",
  superficie: "projectAreaSize",
  "superficie local": "projectAreaSize",
  "superficie implantation": "projectAreaSize",
  avantages: "projectAdvantages",
  "avantages projet": "projectAdvantages",
  autorisation: "projectAuthorizations",
  "autorisations": "projectAuthorizations",
  "autorisations administratives": "projectAuthorizations",
  "mode exploitation": "projectExploitationMode",
  "mode d exploitation": "projectExploitationMode",
  exploitation: "projectExploitationMode",
  "a avantages": "hasProjectAdvantages",
  "possede avantages": "hasProjectAdvantages",
  "a autorisations": "hasProjectAuthorizations",
  "possede autorisations": "hasProjectAuthorizations",
  "nom entreprise": "companyName",
  "raison sociale": "companyName",
  "nom societe": "companyName",
  entreprise: "companyName",
  societe: "companyName",
  industrie: "industry",
  mission: "missionStatement",
  "mission entreprise": "missionStatement",
  "date creation": "foundingDate",
  "date de creation": "foundingDate",
  "date fondation": "foundingDate",
  // ── Financement ──
  "montant credit": "loanAmount",
  "montant du credit": "loanAmount",
  "montant emprunt": "loanAmount",
  emprunt: "loanAmount",
  pret: "loanAmount",
  "duree credit": "loanDuration",
  "duree du credit": "loanDuration",
  "duree emprunt": "loanDuration",
  duree: "loanDuration",
  "taux interet": "loanInterestRate",
  "taux d interet": "loanInterestRate",
  "objet credit": "loanPurpose",
  "objet du credit": "loanPurpose",
  "objet de financement": "loanPurpose",
  destinationcredit: "loanPurpose",
  "justification credit": "loanJustification",
  justification: "loanJustification",
  "justification du credit": "loanJustification",
  "a credit bts": "hasBtsCredit",
  "bts": "hasBtsCredit",
  "details bts": "btsCreditDetails",
  "details credit bts": "btsCreditDetails",
  "a credit bancaire": "hasBankCredit",
  "details banque": "bankCreditDetails",
  "details credit bancaire": "bankCreditDetails",
  "a garanties": "hasGuarantees",
  "details garanties": "guaranteesDetails",
  "frais etablissement": "startupCosts",
  "frais de creation": "startupCosts",
  "frais demarrage": "startupCosts",
  "fonds de roulement": "workingCapital",
  bfr: "workingCapital",
  "besoin fonds roulement": "workingCapital",
  "apport personnel": "personalContribution",
  apport: "personalContribution",
  subvention: "grantAmount",
  subventions: "grantAmount",
  "montant subvention": "grantAmount",
  "montant dotation": "dotation",
  "credit bancaire": "bankLoan",
  "credit btbct": "bankLoan",
  "autres financements": "otherFunding",
  "financement externe": "externalFunding",
  "cout investissement": "investmentCost",
  "montant investissement": "investmentCost",
  investissement: "investmentCost",
  "total investissement": "investmentTotal",
  "total investissements": "investmentTotal",
  amenagement: "amenagements",
  travaux: "amenagements",
  "travaux amenagements": "amenagements",
  "cout loyer": "projectRentCost",
  loyer: "projectRentCost",
  "montant loyer projet": "projectRentCost",
  "repartition investissement": "investmentBreakdown",
  "detail investissement": "investmentBreakdown",
  "structuration financement": "investmentBreakdown",
  // ── Fiscalite et ratios ──
  "charges sociales": "socialChargesRate",
  "taux charges sociales": "socialChargesRate",
  "taux cotisations": "socialChargesRate",
  "classe tns": "cnssTnsClass",
  "classe cnss": "cnssTnsClass",
  smig: "cnssTnsSmig",
  "smig tns": "cnssTnsSmig",
  "salaire minimum": "cnssTnsSmig",
  "nombre mois tns": "cnssTnsNbMois",
  "mois cnss": "cnssTnsNbMois",
  "regime fiscal": "taxRegime",
  fiscalite: "taxRegime",
  regime: "taxRegime",
  "taxes fixes": "fixedTaxes",
  "taux impot": "taxRate",
  "taux de l impot": "taxRate",
  "taux fiscal": "taxRate",
  "taux tfp": "tfpRate",
  tfp: "tfpRate",
  "taux foprolos": "foprolosRate",
  foprolos: "foprolosRate",
  "taux tcl": "tclRate",
  tcl: "tclRate",
  "droits enregistrement": "stampsAndRegistration",
  "timbre et enregistrement": "stampsAndRegistration",
  enregistrement: "stampsAndRegistration",
  "taux croissance ca": "turnoverGrowthRate",
  "croissance ca": "turnoverGrowthRate",
  "taux croissance": "turnoverGrowthRate",
  "taux croissance charges": "expensesGrowthRate",
  "croissance charges": "expensesGrowthRate",
  "taux actualisation": "discountRate",
  "taux actualise": "discountRate",
  "taux de comptage": "discountRate",
  "nombre annees": "projectionYears",
  "nb annees": "projectionYears",
  "duree projection": "projectionYears",
  "horizon projection": "projectionYears",
  "annee croisiere": "cruiseYear",
  "annee de reference": "cruiseYear",
  "annee cle": "cruiseYear",
  "inclure annee 0": "includeYearZero",
  "avec annee 0": "includeYearZero",
  "ca annee 1": "turnoverYear1",
  "ca annee 2": "turnoverYear2",
  "ca annee 3": "turnoverYear3",
  "chiffre affaires annee 1": "turnoverYear1",
  "resultat annee 1": "netProfitYear1",
  "resultat net annee 1": "netProfitYear1",
  "resultat annee 2": "netProfitYear2",
  "resultat annee 3": "netProfitYear3",
  "financement necessaire": "fundingRequired",
  "besoin financement": "fundingRequired",
  "resume executif": "executiveSummary",
  synthese: "executiveSummary",
  resume: "executiveSummary",
  // ── Marche, 7P et exploitation ──
  "etude de marche": "marketStudy",
  "etude marche": "marketStudy",
  "analyse marche": "marketStudy",
  "marche et concurrence": "marketStudy",
  "strategie marketing": "marketingStrategy",
  "strategie commerciale": "marketingStrategy",
  "plan marketing": "marketingStrategy",
  strategie: "marketingStrategy",
  "procede fabrication": "manufacturingProcess",
  "processus fabrication": "manufacturingProcess",
  "mode operatoire": "manufacturingProcess",
  "description produits": "productsDescription",
  "description des produits": "productsDescription",
  "description services": "productsDescription",
  "description des produits et services": "productsDescription",
  "clientele cible": "targetAudience",
  clientele: "targetAudience",
  clients: "targetAudience",
  cible: "targetAudience",
  "public cible": "targetAudience",
  "justification emplacement": "locationDescription",
  "justification du choix de l emplacement": "locationDescription",
  "description emplacement": "locationDescription",
  "ventilation ventes": "salesBreakdown",
  "ventilation des ventes": "salesBreakdown",
  "repartition ventes": "salesBreakdown",
  "detail ventes": "salesBreakdown",
  "ventilation achats": "purchasingBreakdown",
  "ventilation des achats": "purchasingBreakdown",
  "repartition achats": "purchasingBreakdown",
  "detail achats": "purchasingBreakdown",
  fournisseurs: "suppliers",
  "principaux fournisseurs": "suppliers",
  "fournisseurs identifies": "suppliers",
  // ── Rentabilite, FFOM, conclusion ──
  "analyse rentabilite": "profitabilityAnalysis",
  "etude rentabilite": "profitabilityAnalysis",
  rentabilite: "profitabilityAnalysis",
  forces: "strengths",
  force: "strengths",
  faiblesses: "weaknesses",
  faiblesse: "weaknesses",
  opportunites: "opportunities",
  opportunite: "opportunities",
  menaces: "threats",
  menace: "threats",
  "avis du redacteur": "editorAdvice",
  "avis redacteur": "editorAdvice",
  "commentaire redacteur": "editorAdvice",
  recommandation: "editorAdvice",
  conseils: "editorAdvice",
  "conseils redacteur": "editorAdvice",
  // ── 7P marketing mix ──
  produit: "marketingP1_product",
  "produit p1": "marketingP1_product",
  "p1 produit": "marketingP1_product",
  "politique tarifaire": "marketingP2_price",
  prix: "marketingP2_price",
  "prix p2": "marketingP2_price",
  "p2 prix": "marketingP2_price",
  distribution: "marketingP3_place",
  "canal p3": "marketingP3_place",
  "p3 distribution": "marketingP3_place",
  "lieu de distribution": "marketingP3_place",
  communication: "marketingP4_promotion",
  "p4 communication": "marketingP4_promotion",
  promotion: "marketingP4_promotion",
  "ressources humaines marketing": "marketingP5_people",
  "p5 personnel": "marketingP5_people",
  "personnel marketing": "marketingP5_people",
  "parcours client": "marketingP6_process",
  "p6 processus": "marketingP6_process",
  "preuve physique": "marketingP7_physicalEvidence",
  "p7 preuve physique": "marketingP7_physicalEvidence",
  preuves: "marketingP7_physicalEvidence",
  // ── Listes et collections ──
  "a qualifications scientifiques": "hasScientificQualifications",
  "possede qualifications scientifiques": "hasScientificQualifications",
  "a qualifications professionnelles": "hasProfessionalQualifications",
  "possede qualifications professionnelles": "hasProfessionalQualifications",
  "a experience": "hasExperience",
  "possede experience": "hasExperience",
  "diplomes scientifiques": "scientificDiplomas",
  "diplomes professionnels": "professionalDiplomas",
  certifications: "professionalDiplomas",
  formations: "trainings",
  "types formation": "trainings",
  "autres formations": "otherTrainings",
  experiences: "experienceItems",
  "experiences professionnelles": "experienceItems",
  postes: "experienceItems",
  "type clients": "customerType",
  "types clients": "customerType",
  "segment clients": "customerType",
  equipements: "equipments",
  "equipements nouveaux": "equipments",
  "materiel": "equipments",
  "biens equipements": "equipments",
  "equipements existants": "existingEquipments",
  "materiel existant": "existingEquipments",
  "equipements actuels": "existingEquipments",
  "materiel deja acquis": "existingEquipments",
  "matieres premieres": "rawMaterials",
  matieres: "rawMaterials",
  consommation: "rawMaterials",
  employes: "personnel",
  salaries: "personnel",
  produits: "products",
  services: "products",
  "produits et services": "products",
  "alertes ignorees": "dismissedWarnings",
  "avertissements ignores": "dismissedWarnings",
  "charges exterieures": "externalCharges",
  "charges externes": "externalCharges",
  "services exterieurs": "externalCharges",
  "projections manuelles": "manualProjections",
  "projection manuelle": "manualProjections",
  "mode cout matieres": "rawMaterialsCostMode",
  "cout matieres mode": "rawMaterialsCostMode",
  "pourcentage matieres": "rawMaterialsCostPercentage",
  "taux matieres": "rawMaterialsCostPercentage",
  "mode cout personnel": "personnelCostMode",
  "cout personnel mode": "personnelCostMode",
  "pourcentage personnel": "personnelCostPercentage",
  "taux personnel": "personnelCostPercentage",
  graphiques: "chartImages",
};

/** Index normalise des alias de premier niveau. */
const FIELD_ALIAS_INDEX = new Map<string, string>();
for (const [alias, field] of Object.entries(FIELD_ALIASES)) {
  const key = normalizeKey(alias);
  // Premiere occurrence gagne : les alias sont rediges dans l'ordre de
  // priorite, ce qui evite qu'un alias generique ecrase un alias precis.
  if (!FIELD_ALIAS_INDEX.has(key)) FIELD_ALIAS_INDEX.set(key, field);
}

/* ───────────────── Gabarits et alias des structures répétées ─────────────────
   Les gabarits reprennent EXACTEMENT les valeurs que l'application applique
   quand l'utilisateur ajoute une ligne (voir `addEquipment`, `addPersonnel`…
   dans BusinessPlanForm). Toute valeur presente dans le fichier est conservee ;
   seule une valeur absente recoit ce defaut, et la substitution est signalee.  */

interface ItemSpec {
  /** Valeurs par defaut d'un element (= valeurs d'une ligne neuve). */
  template: Record<string, string | number>;
  /** Alias normalises -> nom de champ canonique. */
  aliases: Record<string, string>;
}

const ITEM_SPECS: Record<string, ItemSpec> = {
  equipments: {
    template: { name: "", priceUnitHT: 0, quantity: 1, tvaRate: 19, duration: 5 },
    aliases: {
      designation: "name", libelle: "name", nom: "name", produit: "name", equipement: "name",
      "prix unitaire": "priceUnitHT", prixunitaire: "priceUnitHT", coutunitaire: "priceUnitHT",
      cout: "priceUnitHT", prix: "priceUnitHT", prixht: "priceUnitHT", purchaseprice: "priceUnitHT",
      quantite: "quantity", qte: "quantity", nombre: "quantity", nb: "quantity",
      tva: "tvaRate", "taux tva": "tvaRate", tauxdetva: "tvaRate",
      duree: "duration", "duree amortissement": "duration", "duree utilisation": "duration",
      amortissement: "duration",
    },
  },
  existingEquipments: {
    template: { name: "", purchasePrice: 0, acquisitionYear: 0, duration: 5 },
    aliases: {
      designation: "name", libelle: "name", nom: "name", equipement: "name",
      "prix achat": "purchasePrice", prix: "purchasePrice", cout: "purchasePrice",
      purchaseprice: "purchasePrice", "cout acquisition": "purchasePrice",
      "annee acquisition": "acquisitionYear", annee: "acquisitionYear", year: "acquisitionYear",
      duree: "duration", "duree amortissement": "duration",
    },
  },
  rawMaterials: {
    template: { name: "", costUnit: 0, quantityAnnual: 0 },
    aliases: {
      designation: "name", libelle: "name", nom: "name", matiere: "name", produit: "name",
      coutunitaire: "costUnit", "cout unitaire": "costUnit", prixunitaire: "costUnit",
      prix: "costUnit", cout: "costUnit",
      "quantite annuelle": "quantityAnnual", quantiteannuelle: "quantityAnnual",
      quantite: "quantityAnnual", qte: "quantityAnnual", "consommation annuelle": "quantityAnnual",
    },
  },
  personnel: {
    template: { position: "", salaryBrut: 0, count: 1, monthsWorked: 12, startYear: 1 },
    aliases: {
      poste: "position", intitule: "position", fonction: "position", emploi: "position", role: "position",
      salaire: "salaryBrut", salairebrut: "salaryBrut", remuneration: "salaryBrut",
      brut: "salaryBrut", "salaire annuel": "salaryBrut",
      effectif: "count", nombre: "count", nb: "count", quantite: "count", unite: "count",
      mois: "monthsWorked", nbremois: "monthsWorked", moistravailles: "monthsWorked",
      monthsworked: "monthsWorked", "duree travail": "monthsWorked",
      "annee debut": "startYear", debut: "startYear", startyear: "startYear", annee: "startYear",
    },
  },
  products: {
    template: { name: "", priceUnit: 0, quantityAnnual: 0 },
    aliases: {
      designation: "name", libelle: "name", nom: "name", produit: "name", service: "name",
      prixunitaire: "priceUnit", "prix unitaire": "priceUnit", prix: "priceUnit", tarif: "priceUnit",
      "quantite annuelle": "quantityAnnual", quantiteannuelle: "quantityAnnual",
      quantite: "quantityAnnual", qte: "quantityAnnual",
    },
  },
  scientificDiplomas: {
    template: { diplomaName: "", institution: "", yearObtained: "" },
    aliases: {
      diplome: "diplomaName", intitule: "diplomaName", nom: "diplomaName", titre: "diplomaName",
      etablissement: "institution", institution: "institution", ecole: "institution", universite: "institution",
      "annee obtenue": "yearObtained", annee: "yearObtained", year: "yearObtained",
      "annee obtention": "yearObtained", datediplome: "yearObtained",
    },
  },
  professionalDiplomas: {
    template: { diplomaName: "", institution: "", yearObtained: "" },
    aliases: {
      diplome: "diplomaName", intitule: "diplomaName", nom: "diplomaName", titre: "diplomaName",
      certification: "diplomaName", etablissement: "institution", institution: "institution",
      ecole: "institution", organisme: "institution",
      "annee obtenue": "yearObtained", annee: "yearObtained", year: "yearObtained",
    },
  },
  experienceItems: {
    // startDate / endDate sont optionnels dans ExperienceItem mais doivent
    // figurer au gabarit : un alias pointant vers un champ absent du gabarit
    // n'aurait aucun type de reference pour la conversion.
    template: { position: "", institution: "", duration: "", startDate: "", endDate: "" },
    aliases: {
      poste: "position", intitule: "position", fonction: "position", emploi: "position", role: "position",
      entreprise: "institution", organisme: "institution", etablissement: "institution", societe: "institution",
      duree: "duration", anciennete: "duration", periode: "duration",
      "date debut": "startDate", debut: "startDate", "date fin": "endDate", fin: "endDate",
    },
  },
};

/* ───────────────────────────── Charges extérieures ───────────────────────────── */

const EXTERNAL_CHARGE_KEYS = [
  "rent", "utilities", "maintenance", "insurance", "fuel",
  "telecom", "advertising", "bankFees", "other",
] as const;

type ExternalChargeKey = (typeof EXTERNAL_CHARGE_KEYS)[number];

/** Alias normalises -> clé canonique des charges extérieures. */
const CHARGE_ALIASES: Record<string, ExternalChargeKey> = {
  loyer: "rent", location: "rent", "loyer annuel": "rent", rent: "rent", rentamount: "rent",
  electricite: "utilities", eau: "utilities", energie: "utilities", utilities: "utilities",
  fluides: "utilities", "eau electricite": "utilities", "electricite eau": "utilities",
  entretien: "maintenance", reparation: "maintenance", maintenance: "maintenance", repair: "maintenance",
  assurance: "insurance", insurance: "insurance",
  carburant: "fuel", essence: "fuel", gasoil: "fuel", fuel: "fuel", transport: "fuel", deplacement: "fuel",
  telecom: "telecom", telephone: "telecom", internet: "telecom", phone: "telecom",
  publicite: "advertising", marketing: "advertising", advertising: "advertising", promotion: "advertising",
  fraisbancaires: "bankFees", fraisbanque: "bankFees", "frais de banque": "bankFees",
  bankfees: "bankFees", commission: "bankFees",
  autre: "other", autres: "other", autrescharges: "other", other: "other", divers: "other",
};

/** Retrouve la charge externe correspondant à un libellé (ancien format tableau). */
function matchChargeByLabel(label: string): ExternalChargeKey | null {
  const normalized = normalizeKey(label);
  if (!normalized) return null;
  if (CHARGE_ALIASES[normalized]) return CHARGE_ALIASES[normalized];
  // Correspondance partielle : « assurance voiture » -> insurance.
  let best: { key: ExternalChargeKey; length: number } | null = null;
  for (const [alias, key] of Object.entries(CHARGE_ALIASES)) {
    if (normalized.includes(alias) && (!best || alias.length > best.length)) {
      best = { key, length: alias.length };
    }
  }
  return best ? best.key : null;
}

const CHARGE_LABEL_KEYS = ["nom", "libelle", "label", "name", "poste", "type", "intitule", "categorie"];
const CHARGE_AMOUNT_KEYS = ["montant", "amount", "value", "cout", "montantannuel", "total", "prix", "somme"];

/**
 * Normalise les charges extérieures, quel que soit le format historique :
 * objet `{ rent, utilities… }`, objet français `{ loyer, electricité… }`
 * ou tableau d'objets `{ nom, montant }`.
 *
 * Les postes non reconnus ne sont PAS discarded : leur montant est cumulé dans
 * `other` pour que le total des charges reste juste, et chaque ligne est
 * signalée dans le rapport afin que le promoteur puisse la reclasser.
 */
export function sanitizeExternalCharges(
  value: unknown,
  fallback: Record<string, number>,
  report?: SanitizeReport
): Record<string, number> {
  const out: Record<string, number> = { ...fallback };

  if (Array.isArray(value)) {
    for (const item of value) {
      if (!isPlainObject(item)) continue;
      const label = toText(pick(item, CHARGE_LABEL_KEYS), "");
      const amount = toNumber(pick(item, CHARGE_AMOUNT_KEYS), 0);
      if (!label && amount === 0) continue;
      const key = matchChargeByLabel(label);
      if (key) out[key] = (out[key] ?? 0) + amount;
      else {
        out.other = (out.other ?? 0) + amount;
        report?.reclassified.push(`« ${label} » (${amount}) -> Autres charges`);
      }
    }
    return out;
  }

  if (isPlainObject(value)) {
    const index = new Map<string, ExternalChargeKey>();
    for (const [alias, key] of Object.entries(CHARGE_ALIASES)) {
      if (!index.has(alias)) index.set(alias, key);
    }
    for (const key of EXTERNAL_CHARGE_KEYS) index.set(normalizeKey(key), key);

    for (const [key, raw] of Object.entries(value)) {
      const canonical = index.get(normalizeKey(key));
      if (!canonical) {
        const amount = toNumber(raw, 0);
        out.other = (out.other ?? 0) + amount;
        report?.reclassified.push(`« ${key} » (${amount}) -> Autres charges`);
        continue;
      }
      out[canonical] = (out[canonical] ?? 0) + toNumber(raw, 0);
    }
  }
  return out;
}

/* ─────────────────────────── Sanitize générique ─────────────────────────── */

/** Journal des transformations appliquees lors d'un import. */
export interface SanitizeReport {
  /**
   * Nombre de champs REELLEMENT remplis a partir du fichier (texte non vide,
   * nombre non nul, collection non vide). C'est ce chiffre que l'utilisateur
   * doit voir : annoncer « 0 champ restaures » alors que le formulaire est
   * plein fait croire a un echec de chargement.
   */
  loaded: number;
  /** Champs repris dans l'etat, avec les cles legacy renommees (« titre » -> projectTitle). */
  renamed: string[];
  /**
   * Valeurs ABSENTES du fichier et completees avec la valeur par defaut de
   * l'application (uniquement dans les lignes d'equipements, de personnel…,
   * car ces defauts changent les chiffres finances).
   */
  defaults: string[];
  /** Postes de charges externes non identifies, cumules dans « Autres charges ». */
  reclassified: string[];
  /** Plusieurs cles du fichier designaient le meme champ : une seule a ete retenue. */
  ambiguous: string[];
  /** Champs conserves tels quels : declares dans BusinessPlanData, hors gabarit. */
  unchecked: string[];
  /**
   * Sous-ensemble de `unchecked` : cles conservees telles quelles qui portent un
   * TEXTE non vide. Elles meritent un avertissement visible car, n'etant pas
   * affichees par l'application, un dossier bancaire ne doit pas les laisser
   * passer sans que le promoteur le sache.
   */
  uncheckedTexts: string[];
}

const createReport = (): SanitizeReport => ({
  loaded: 0,
  renamed: [],
  defaults: [],
  reclassified: [],
  ambiguous: [],
  unchecked: [],
  uncheckedTexts: [],
});

/** Une valeur porte-t-elle reellement une information ? */
const isFilledValue = (value: unknown): boolean => {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "boolean") return value === true;
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return false;
};

/**
 * Nombre de champs charges, affiche a l'utilisateur. Ne compte que les
 * champs porteurs de donnees : une chaine vide ou un 0 par defaut ne doivent
 * pas gonfler le compteur, et un compteur a zero doit signifier « rien n'a ete
 * trouve », pas « le compteur est mal calcule ».
 */
export const countReportFields = (report: SanitizeReport): number =>
  report.loaded + report.unchecked.length;

/** Normalise un tableau d'objets répétés selon son gabarit. */
function sanitizeItems(field: string, value: unknown, report: SanitizeReport): unknown[] {
  if (!Array.isArray(value)) return [];
  const spec = ITEM_SPECS[field];
  if (!spec) {
    // Tableaux de simples chaînes (trainings, otherTrainings, dismissedWarnings).
    return value
      .map((item) =>
        isPlainObject(item) ? toText(pick(item, ["value", "name", "label", "nom", "libelle"]), "") : toText(item, "")
      )
      .filter((item) => item.length > 0);
  }

  // Index normalise des cles canoniques : indispensable pour reconnaitre
  // « priceUnitHT » dans un fichier ecrit en camelCase, en snake_case ou
  // avec des separateurs.
  const index = new Map<string, string>();
  for (const key of Object.keys(spec.template)) index.set(normalizeKey(key), key);

  return value.filter(isPlainObject).map((item, row) => {
    const source = item as Record<string, unknown>;
    const clean: Record<string, unknown> = { ...spec.template };
    const provided = new Set<string>();

    for (const [key, raw] of Object.entries(source)) {
      if (raw === undefined || raw === null) continue;
      const normalized = normalizeKey(key);
      const canonical = index.get(normalized) ?? spec.aliases[normalized];
      // Un alias ne peut viser qu'un champ du gabarit : sans type de reference,
      // la conversion serait impossible.
      if (!canonical || !(canonical in spec.template)) continue;
      const fallback = spec.template[canonical];
      clean[canonical] =
        typeof fallback === "number" ? toNumber(raw, fallback) : toText(raw, String(fallback));
      provided.add(canonical);
    }

    // Un champ non fourni recoit la valeur d'une ligne neuve. Seuls les
    // defauts NUMERIQUES sont signales : ce sont les seuls qui entrent dans
    // les calculs de l'application. Les libelles vides restent inertes.
    for (const [key, fallbackValue] of Object.entries(spec.template)) {
      if (provided.has(key) || typeof fallbackValue !== "number") continue;
      report.defaults.push(`${field}[${row}].${key} = ${JSON.stringify(fallbackValue)}`);
    }

    // Le personnel exige des annees de projection coherentes, sinon la masse
    // salariale vaut NaN. On ne reconstruit que si le fichier en provide.
    if (field === "personnel") {
      const yearly = source.yearlyData;
      clean.yearlyData = Array.isArray(yearly)
        ? yearly.filter(isPlainObject).map((y) => ({
            year: toNumber(y.year, 1),
            count: toNumber(y.count, Number(clean.count)),
            salaryBrut: toNumber(y.salaryBrut, Number(clean.salaryBrut)),
          }))
        : [];
    }
    return clean;
  });
}

/**
 * Conserve un dictionnaire libre (`manualProjections`, `chartImages`) en ne
 * gardant que les valeurs exploitables.
 */
function sanitizeFreeForm(value: unknown, depth = 0): Record<string, unknown> {
  if (!isPlainObject(value) || depth > 3) return {};
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === null || entry === undefined) continue;
    if (typeof entry === "number") {
      if (Number.isFinite(entry)) out[key] = entry;
    } else if (typeof entry === "string" || typeof entry === "boolean") {
      out[key] = entry;
    } else if (Array.isArray(entry)) {
      out[key] = entry.filter((item) => item !== null && item !== undefined);
    } else if (isPlainObject(entry)) {
      out[key] = sanitizeFreeForm(entry, depth + 1);
    }
  }
  return out;
}

/** Normalise un champ selon le type de sa valeur par défaut. */
function coerceValue(key: string, value: unknown, fallback: unknown, report: SanitizeReport): unknown {
  if (value === undefined || value === null) return fallback;

  if (typeof fallback === "number") return toNumber(value, fallback);
  if (typeof fallback === "string") return toText(value, fallback);
  if (typeof fallback === "boolean") return toBoolean(value, fallback);

  if (Array.isArray(fallback)) {
    if (key in ITEM_SPECS) return sanitizeItems(key, value, report);
    if (!Array.isArray(value)) return fallback;
    // Liste de chaines (customerType, dismissedWarnings, trainings...). Le
    // tableau par defaut n'est PAS une liste blanche : filtrer dessus
    // supprimerait des choix valides (customerType vaut ["B2C"] par defaut,
    // un projet enregistre peut parfaitement contenir "B2B").
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => toText(item, ""))
      .filter((item) => item.length > 0);
  }

  if (isPlainObject(fallback)) {
    if (key === "externalCharges") {
      // Le gabarit est type `Record<string, unknown>` en general (certains
      // dictionnaires sont libres), mais externalCharges est numerique par
      // construction : la conversion est donc sur, et signalee comme telle.
      return sanitizeExternalCharges(value, fallback as Record<string, number>, report);
    }
    // Dictionnaire libre : le gabarit est vide, aucun type de reference.
    if (Object.keys(fallback).length === 0) return sanitizeFreeForm(value);
    const out: Record<string, unknown> = { ...fallback };
    if (isPlainObject(value)) {
      const index = new Map<string, string>();
      for (const inner of Object.keys(fallback)) index.set(normalizeKey(inner), inner);
      for (const [innerKey, innerValue] of Object.entries(value)) {
        const canonical = index.get(normalizeKey(innerKey));
        if (!canonical) continue;
        out[canonical] = coerceValue(canonical, innerValue, fallback[canonical], report);
      }
    }
    return out;
  }

  return value;
}

/**
 * Normalise un objet de projet importe vers le schema `BusinessPlanData`.
 *
 * @param raw    objet lu dans le fichier (JSON ou piece jointe du PDF)
 * @param schema valeurs par defaut servant de reference de types
 */
export function sanitizeProjectData(
  raw: unknown,
  schema: BusinessPlanData
): { data: BusinessPlanData; report: SanitizeReport } {
  const report = createReport();
  if (!isPlainObject(raw)) {
    return { data: { ...schema }, report };
  }

  const template = schema as unknown as Record<string, unknown>;

  // Index normalise des cles du schema, pour reconnaitre aussi bien
  // « personnelCostMode » que « personnel_cost_mode ».
  const schemaIndex = new Map<string, string>();
  for (const field of Object.keys(template)) schemaIndex.set(normalizeKey(field), field);

  const data: Record<string, unknown> = { ...template };
  /** Cle canonique -> cle du fichier qui l'a alimentee. */
  const origin = new Map<string, string>();

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === null) continue;

    // Resolution du nom canonique : cle exacte -> variante du schema -> alias.
    const canonical =
      key in template ? key : schemaIndex.get(normalizeKey(key)) ?? FIELD_ALIAS_INDEX.get(normalizeKey(key));

    if (canonical === undefined || !(canonical in template)) {
      // Champ declare dans `BusinessPlanData` mais absent du gabarit : on le
      // conserve plutot que de le perdre, et on le signale.
      if (isPlainObject(value)) data[key] = sanitizeFreeForm(value);
      else if (Array.isArray(value)) data[key] = value.filter((item) => item !== null && item !== undefined);
      else if (typeof value === "number") data[key] = Number.isFinite(value) ? value : 0;
      else if (typeof value === "string" || typeof value === "boolean") data[key] = value;
      report.unchecked.push(key);
      // Un texte non vide ici ne sera affiche nulle part dans l'application :
      // il doit donc etre signale, pas conserve en silence.
      if (typeof value === "string" && value.trim().length > 0) report.uncheckedTexts.push(key);
      continue;
    }

    if (canonical !== key) report.renamed.push(`${key} -> ${canonical}`);
    // Plusieurs cles du fichier peuvent designer le meme champ (« description »
    // et « descriptionDuProjet »). On retient la plus specifique et on le
    // signale : sur un dossier bancaire, l'utilisateur doit pouvoir verifier
    // quel texte a ete retenu.
    const previous = origin.get(canonical);
    if (previous !== undefined) {
      const keepNew = normalizeKey(key).length > normalizeKey(previous).length;
      report.ambiguous.push(
        keepNew
          ? `${canonical} : « ${key} » retenu a la place de « ${previous} »`
          : `${canonical} : « ${key} » ignore (« ${previous} » deja retenu)`
      );
      if (!keepNew) continue;
    }
    origin.set(canonical, key);
    data[canonical] = coerceValue(canonical, value, template[canonical], report);
    if (isFilledValue(data[canonical])) report.loaded++;
  }

  return { data: data as unknown as BusinessPlanData, report };
}