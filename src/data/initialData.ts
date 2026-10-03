import type { BusinessPlanData } from "@/types/businessPlan";
import { getDefaultSMIGForYear } from "@/utils/financialCalculations";

/**
 * Valeurs par defaut du formulaire : schema de reference de l'application.
 * Sert egalement de gabarit lors d'un import, pour garantir que tout fichier
 * ancien conserve des types valides et ne provoque jamais de NaN dans le
 * moteur financier (voir sanitizeProjectData).
 */export const initialData: BusinessPlanData = {
  // 1. Informations du Promoteur
  promoterName: "",
  promoterBirthDate: "",
  promoterBirthPlace: "",
  promoterCin: "",
  promoterCinDate: "",
  promoterEducationLevel: "universitaire",
  promoterDiploma: "",
  promoterDiplomaYear: "",
  promoterMaritalStatus: "celibataire",
  promoterMilitaryService: "non_obligatoire",
  promoterAddress: "",
  promoterPhone: "",
  promoterEmail: "",
  promoterHousingStatus: "propriete",

  promoterSpouseFunction: "",
  promoterSpouseIncome: 0,
  promoterAge: 0,

  // 2. Qualifications & Experience
  hasScientificQualifications: false,
  hasProfessionalQualifications: false,
  hasExperience: false,

  scientificDiplomas: [],
  professionalDiplomas: [],
  trainings: [],
  otherTrainings: [],
  experienceYears: 0,
  experienceItems: [],

  qualifications: "",
  experience: "",

  // 3. Projet
  projectTitle: "",
  projectDescription: "",
  projectLocation: "",
  legalStructure: "PP",
  projectSector: "Services",
  activityType: "Prestation de service",
  revenueModel: "Vente ponctuelle",
  salesChannel: "Physique",
  customerType: ["B2C"],
  projectNature: "creation",
  projectAreaSize: 0,
  investmentCost: 0,
  hasProjectAdvantages: false,
  projectAdvantages: "",
  hasProjectAuthorizations: false,
  projectAuthorizations: "",
  projectExploitationMode: "location",
  projectRentCost: 0,

  // 4. Crédit
  loanAmount: 0,
  loanDuration: 84,
  loanInterestRate: 10,
  loanPurpose: "",
  loanJustification: "",

  // 5. Centrale Risque
  hasBtsCredit: false,
  btsCreditDetails: "",
  hasBankCredit: false,
  bankCreditDetails: "",
  hasGuarantees: false,
  guaranteesDetails: "",

  // 6. Investissement
  equipments: [],
  existingEquipments: [],
  startupCosts: 0,
  workingCapital: 0,

  personalContribution: 0,
  grantAmount: 0,
  dotation: 0,
  bankLoan: 0,
  otherFunding: 0,

  investmentTotal: 0,
  externalFunding: 0,
  investmentBreakdown: "",

  // 7. Marché
  marketStudy: "",
  marketingStrategy: "",
  manufacturingProcess: "",
  productsDescription: "",
  targetAudience: "",
  locationDescription: "",
  salesBreakdown: "",
  purchasingBreakdown: "",
  suppliers: "",

  // 8. Rentabilité
  rawMaterials: [],
  personnel: [],
  socialChargesRate: 17.07,
  cnssTnsClass: 1,
  cnssTnsSmig: getDefaultSMIGForYear(new Date().getFullYear()),
  cnssTnsNbMois: 3,
  externalCharges: {
    rent: 0,
    utilities: 0,
    maintenance: 0,
    insurance: 0,
    fuel: 0,
    telecom: 0,
    advertising: 0,
    bankFees: 0,
    other: 0
  },
  products: [],
  taxRegime: 'reel',
  fixedTaxes: 0,
  taxRate: 20,
  tfpRate: 2,
  foprolosRate: 1,
  tclRate: 0.2,
  stampsAndRegistration: 0,
  turnoverGrowthRate: 10,
  expensesGrowthRate: 8,
  discountRate: 12,
  projectionYears: 7,
  cruiseYear: 3,
  includeYearZero: false,

  turnoverYear1: 0,
  turnoverYear2: 0,
  turnoverYear3: 0,
  netProfitYear1: 0,
  netProfitYear2: 0,
  netProfitYear3: 0,
  profitabilityAnalysis: "",

  // 9. FFOM
  strengths: "",
  weaknesses: "",
  opportunities: "",
  threats: "",

  // 10. Conclusion
  conclusion: "",
  editorAdvice: "",

  // Legacy
  companyName: "",
  industry: "",
  missionStatement: "",

  // Champs optionnels declares dans `BusinessPlanData` mais non initialises
  // historiquement. Les completer ici garantit qu'un projet importe conserve
  // toutes ses donnees (le gabarit sert de reference de types a l'import).
  promoterFatherFunction: "",
  promoterFatherIncome: 0,
  promoterMotherFunction: "",
  promoterMotherIncome: 0,
  promoterOtherResources: "",
  promoterOtherResourcesAmount: 0,
  promoterRentAmount: 0,
  promoterOtherCharges: "",
  promoterOtherChargesAmount: 0,
  promoterGuarantee: "",
  amenagements: 0,
  marketingP1_product: "",
  marketingP2_price: "",
  marketingP3_place: "",
  marketingP4_promotion: "",
  marketingP5_people: "",
  marketingP6_process: "",
  marketingP7_physicalEvidence: "",
  rawMaterialsCostMode: "detailed",
  rawMaterialsCostPercentage: 0,
  personnelCostMode: "detailed",
  personnelCostPercentage: 0,
  manualProjections: {},
  dismissedWarnings: [],
  foundingDate: "",
  executiveSummary: "",
  fundingRequired: 0,
  year1Revenue: 0,
};
