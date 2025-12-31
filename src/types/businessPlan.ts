
export interface DiplomaItem {
  diplomaName: string;
  institution: string;
  yearObtained: string;
}

export interface TrainingItem {
  trainingType: string; // CEFE, CREE, GERME, MORAINE, Autre
  otherDescription?: string;
  year?: string;
}

export interface ExperienceItem {
  position: string;
  institution: string; // Entreprise ou organisme d'accueil
  duration: string; // Nombre d'années ou période
  startDate?: string;
  endDate?: string;
}

export interface BusinessPlanData {
  // 1. Informations du Promoteur
  promoterName: string;
  promoterBirthDate: string;
  promoterBirthPlace: string;
  promoterCin: string;
  promoterCinDate: string;

  promoterEducationLevel: string;
  promoterDiploma: string; // Keep for mapping primary diploma if needed
  promoterDiplomaYear: string;

  promoterMaritalStatus: string;
  promoterMilitaryService: string;

  promoterAddress: string;
  promoterEmail?: string;
  promoterPhone: string;

  // Informations Famille
  promoterFatherFunction?: string;
  promoterFatherIncome?: number;
  promoterMotherFunction?: string;
  promoterMotherIncome?: number;
  promoterSpouseFunction?: string;
  promoterSpouseIncome?: number;

  // Situation Financière Personnelle
  promoterOtherResources?: string;
  promoterOtherResourcesAmount?: number;

  promoterHousingStatus: string;
  promoterRentAmount?: number;

  promoterOtherCharges?: string;
  promoterOtherChargesAmount?: number;

  promoterGuarantee?: string;

  promoterAge: number;

  // 2. Qualification et experience professionnelle - RESTUCTURED

  // Toggle flags
  hasScientificQualifications: boolean;
  hasProfessionalQualifications: boolean;
  hasExperience: boolean;

  // Dynamic Lists
  scientificDiplomas: DiplomaItem[];
  professionalDiplomas: DiplomaItem[];
  trainings: string[]; // List of selected trainings: CEFE, CREE, etc.
  otherTrainings: string[]; // List of other specific trainings

  experienceYears: number;
  experienceItems: ExperienceItem[];

  // Legacy string summaries (can be auto-generated from arrays for AI context)
  qualifications: string;
  experience: string;

  // 3. Le projet
  projectTitle: string;
  projectDescription: string;
  projectLocation: string; // Lieu d'implantation
  legalStructure: string;

  projectNature: string; // creation, extension
  projectAreaSize: number; // Superficie du local (m²)
  investmentCost: number; // Coût d'investissement global

  hasProjectAdvantages: boolean; // Avantages spécifiques ou globaux
  projectAdvantages?: string; // Si oui, lesquels

  hasProjectAuthorizations: boolean; // Autorisation d'exercice etc.
  projectAuthorizations?: string; // Si oui, nature

  projectExploitationMode: string; // propriete, location
  projectRentCost?: number; // Si location, coût mensuel

  // 4. Le crédit
  loanAmount: number;
  loanDuration: number;
  loanInterestRate: number; // Taux d'intérêt annuel (ex: 10%)
  loanPurpose: string; // Objet du crédit
  loanJustification: string; // Justification de crédit

  // 5. Centrale Risque
  // riskCentralStatus: string; // Removed legacy field

  hasBtsCredit: boolean; // Crédit au niveau de la BTS
  btsCreditDetails?: string; // Si oui, détails

  hasBankCredit: boolean; // Crédit au niveau du système bancaire
  bankCreditDetails?: string; // Si oui, détails

  hasGuarantees: boolean; // Garanties réelles prévues
  guaranteesDetails?: string; // Si oui, détails

  // 6. Investissement et Financement (NEW STRUCT)
  equipments: EquipmentItem[];
  startupCosts: number; // Frais d'établissement
  workingCapital: number; // Fonds de roulement (BFR)

  // Resources
  personalContribution: number;
  grantAmount: number; // Subventions
  dotation: number; // Dotation
  bankLoan: number; // Crédits bancaires
  otherFunding: number; // Autres financements

  investmentTotal: number; // Computed
  externalFunding: number; // Computed
  investmentBreakdown: string; // Legacy

  // 7. Etude de marché
  marketStudy: string;
  marketingStrategy: string;
  manufacturingProcess: string;
  productsDescription: string;
  targetAudience: string;
  locationDescription: string;
  salesBreakdown: string;
  purchasingBreakdown: string;
  suppliers: string;

  // 8. Rentabilité (NEW STRUCT)
  // 8.1 Matières premières
  rawMaterials: RawMaterialItem[];
  rawMaterialsCostMode?: 'detailed' | 'percentage';
  rawMaterialsCostPercentage?: number;

  // 8.2 Personnel
  personnel: PersonnelItem[];
  personnelCostMode?: 'detailed' | 'percentage';
  personnelCostPercentage?: number;
  socialChargesRate: number; // Taux charges sociales (ex: 19%)

  // Overrides & UI State
  manualProjections?: Record<number, Partial<YearlyResults>>;
  dismissedWarnings?: string[];

  // 8.7 Produits (Revenue)
  products: ProductItem[];

  // 8.3 Charges Extérieures
  externalCharges: ExternalCharges;

  // 8.5 Fiscalité
  taxRegime: 'forfaitaire' | 'reel'; // Forfaitaire or Réel
  fixedTaxes: number; // Taxes fixes
  taxRate: number; // Taux impôt sur les bénéfices (ex: 15%)
  tfpRate: number; // TFP (1% industry, 2% others)
  foprolosRate: number; // FOPROLOS (1%)
  tclRate: number; // TCL
  stampsAndRegistration: number; // Droits de timbre et enregistrement

  // 8.9 Prévisions
  turnoverGrowthRate: number; // Taux croissance CA
  expensesGrowthRate: number; // Taux évolution charges
  discountRate: number; // Taux d'actualisation (ex: 12%)
  projectionYears: number; // Nombre d'années de projection (ex: 7)
  cruiseYear: number; // Année de croisière (ex: 3)

  // 8.7 & 8.8 Operating Results (Computed)
  turnoverYear1: number;
  turnoverYear2: number;
  turnoverYear3: number;
  netProfitYear1: number;
  netProfitYear2: number;
  netProfitYear3: number;
  profitabilityAnalysis: string;

  // 9. Analyse FFOM
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;

  // 10. Conclusion generale
  conclusion: string;
  editorAdvice: string;

  // Legacy/Helper fields
  companyName?: string;
  industry?: string;
  foundingDate?: string;
  missionStatement?: string;
  executiveSummary?: string;
  fundingRequired?: number;
  year1Revenue?: number;

  // Captured Images for Export
  chartImages?: {
    breakEven?: string;
    breakEvenEvolution?: string;
    profitability?: string;
    cashFlow?: string;
  };
}

export type ExportFormat = 'pdf' | 'docx';

export interface FormStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

// Financial Simulator Interfaces
export interface EquipmentItem {
  name: string;
  priceUnitHT: number;
  quantity: number;
  tvaRate: number;
  duration: number;
}

export interface RawMaterialItem {
  name: string;
  costUnit: number;
  quantityAnnual: number;
}

export interface PersonnelItem {
  position: string;
  salaryBrut: number; // Base salary for Year 1
  count: number; // Base count for Year 1
  monthsWorked: number;
  startYear?: number;
  yearlyData?: { year: number; count: number; salaryBrut: number }[];
}

export interface ExternalCharges {
  rent: number;
  utilities: number;
  maintenance: number;
  insurance: number;
  fuel: number;
  telecom: number;
  advertising: number;
  bankFees: number;
  other: number;
}

export interface ProductItem {
  name: string;
  priceUnit: number;
  quantityAnnual: number;
}

export interface AmortizationRow {
  name: string;
  ht: number;
  duration: number;
  yearlyValues: number[];
}

export interface LoanRepaymentRow {
  year: number;
  principal: number;
  interest: number;
  total: number;
  remainingBalance: number;
}

export interface OperatingResults {
  years: YearlyResults[];
  detailedAmortization: AmortizationRow[];
  loanRepayment: LoanRepaymentRow[];
  summary: {
    van: number;
    payback: { years: number, months: number } | null;
    roi: number;
    breakEvenPoint: number;
    totalInvestment: number;
    fixedCostsCruise: number;
    variableCostsCruise: number;
    contributionMarginCruise: number;
    cruiseYear: number;
    cruiseYearData: YearlyResults;
  };
  cumulativeCFSeries: Array<{ year: number, cumulative: number }>;
  breakEvenEvolution: Array<{ year: number, turnover: number, breakEvenPoint: number }>;
  cvpData: Array<{ percentage: number, revenue: number, fixedCosts: number, totalCosts: number }>;
}

export interface InvestmentResults {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export interface YearlyResults {
  turnover: number;
  materialsCost: number;
  personnelCost: number;
  totalGrossSalary: number;
  cnss: number;
  tfp: number;
  foprolos: number;
  tcl: number;
  servicesExterieursTotal: number;
  autresServicesExterieursTotal: number;
  externalChargesTotal: number;
  amortization: number;
  financialCharges: number;
  totalExpenses: number;
  preTaxIncome: number;
  corporateTax: number;
  totalTaxes: number;
  netResult: number;
  cashFlow: number;
  discountedCashFlow: number;
}
