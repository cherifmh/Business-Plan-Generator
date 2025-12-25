
import { BusinessPlanData } from "@/types/businessPlan";

export const demoData: BusinessPlanData = {
    // 1. Informations du Promoteur
    promoterName: "Ahmed Ben Salah",
    promoterBirthDate: "1985-05-12",
    promoterBirthPlace: "Tunis",
    promoterCin: "08123456",
    promoterCinDate: "2010-06-20",
    promoterEducationLevel: "universitaire",
    promoterDiploma: "Master en Marketing Digital",
    promoterDiplomaYear: "2018",
    promoterMaritalStatus: "marie",
    promoterMilitaryService: "non_obligatoire",
    promoterAddress: "15 Rue de la République, Ariana",
    promoterPhone: "98765432",
    promoterEmail: "ahmed.bensalah@email.com",
    promoterHousingStatus: "propriete",

    promoterSpouseFunction: "Enseignante",
    promoterSpouseIncome: 1200,
    promoterAge: 39,

    // 2. Qualifications & Experience
    hasScientificQualifications: true,
    hasProfessionalQualifications: true,
    hasExperience: true,

    scientificDiplomas: [
        { diplomaName: "Licence en Gestion", institution: "IHEC Carthage", yearObtained: "2008" }
    ],
    professionalDiplomas: [
        { diplomaName: "Certification Google Ads", institution: "Google", yearObtained: "2019" }
    ],
    trainings: ["CEFE"],
    otherTrainings: ["Formation Communication"],
    experienceYears: 10,
    experienceItems: [
        { position: "Manager Marketing", institution: "Digital Agency TN", duration: "5 ans", startDate: "2015" }
    ],

    qualifications: "Expert en marketing digital avec une solide formation académique en gestion.",
    experience: "10 ans d'expérience dans le secteur du web et de la communication digitale.",

    // 3. Projet
    projectTitle: "DigiTech Solutions",
    projectDescription: "Agence de marketing digital spécialisée dans l'accompagnement des PME tunisiennes pour leur transformation numérique. Services proposés : gestion des réseaux sociaux, création de sites web, publicité en ligne (SEO/SEA).",
    projectLocation: "Lac 2, Tunis",
    legalStructure: "SARL",
    projectNature: "creation",
    projectAreaSize: 80,
    investmentCost: 45000,
    hasProjectAdvantages: true,
    projectAdvantages: "Exonération d'impôts les 4 premières années (Loi Startups).",
    hasProjectAuthorizations: false,
    projectAuthorizations: "",
    projectExploitationMode: "location",
    projectRentCost: 1200,

    // 4. Crédit
    loanAmount: 20000,
    loanDuration: 60,
    loanInterestRate: 10,
    loanPurpose: "Acquisition de matériel informatique performant et aménagement du local.",
    loanJustification: "Le fonds propre ne couvre que 60% de l'investissement nécessaire.",

    // 5. Centrale Risque
    hasBtsCredit: false,
    btsCreditDetails: "",
    hasBankCredit: false,
    bankCreditDetails: "",
    hasGuarantees: false,
    guaranteesDetails: "",

    // 6. Investissement
    equipments: [
        { name: "Ordinateurs Mac (x3)", ht: 15000, count: 1, buyingDate: "2024-01-01", amortizationDuration: 3 },
        { name: "Mobilier de bureau", ht: 5000, count: 1, buyingDate: "2024-01-01", amortizationDuration: 5 },
        { name: "Logiciels & Licences", ht: 5000, count: 1, buyingDate: "2024-01-01", amortizationDuration: 3 }
    ],
    startupCosts: 2000,
    workingCapital: 10000,

    personalContribution: 25000,
    grantAmount: 0,
    dotation: 0,
    bankLoan: 20000,
    otherFunding: 0,

    investmentTotal: 47000,
    externalFunding: 20000,
    investmentBreakdown: "Fonds propres (53%), Crédit Bancaire (47%).",

    // 7. Marché
    marketStudy: "Le marché du marketing digital en Tunisie est en pleine croissance (+15% par an). La demande des PME pour une présence en ligne professionnelle explose, notamment après la digitalisation accélérée par les crises récentes. Nos concurrents sont d'autres agences locales, mais nous nous différencions par une offre packagée adaptée aux petits budgets.",
    marketingStrategy: "Prospection directe via LinkedIn, organisation de webinaires gratuits pour les PME, partenariats avec des experts-comptables pour recommander nos services.",
    manufacturingProcess: "1. Audit client. 2. Proposition stratégique. 3. Validation et contrat. 4. Mise en œuvre mensuelle. 5. Reporting.",
    productsDescription: "Pack Présence (Gestion FB/Insta), Pack Site Web (Vitrine), Pack Performance (Ads).",
    targetAudience: "PME tunisiennes (CA < 1M TND), secteurs services et commerce de détail.",
    locationDescription: "Bureaux modernes au Lac 2, zone d'affaires prestigieuse et accessible.",
    salesBreakdown: "Pack Présence : 40%, Pack Site Web : 30%, Pack Performance : 30%.",
    purchasingBreakdown: "Abonnements logiciels (SaaS), régie publicitaire.",
    suppliers: "Google, Meta, Adobe, fournisseurs d'accès internet.",

    // 8. Rentabilité
    rawMaterials: [],
    personnel: [
        { position: "Community Manager", salaryBrut: 1200, count: 2, monthsWorked: 12, startYear: 1 },
        { position: "Développeur Web", salaryBrut: 1800, count: 1, monthsWorked: 12, startYear: 1 }
    ],
    socialChargesRate: 17.07,
    externalCharges: {
        rent: 14400, // 1200 * 12
        utilities: 2400,
        maintenance: 1000,
        insurance: 1500,
        fuel: 2000,
        telecom: 3600,
        advertising: 5000,
        bankFees: 600,
        other: 2000
    },
    products: [
        { name: "Pack Présence", dailyProduction: 1, costUnit: 0, priceUnit: 500, salesVolume: 240 },
        { name: "Pack Site Web", dailyProduction: 5, costUnit: 500, priceUnit: 2500, salesVolume: 12 },
    ],

    // Projections manuelles pour simplifier la démo si nécessaire, mais calculées automatiquement par défaut
    turnoverYear1: 120000,
    turnoverYear2: 150000,
    turnoverYear3: 185000,

    taxRegime: 'reel',
    fixedTaxes: 0,
    taxRate: 15,
    tfpRate: 2,
    foprolosRate: 1,
    tclRate: 0.2,
    stampsAndRegistration: 500,
    turnoverGrowthRate: 15,
    expensesGrowthRate: 5,
    discountRate: 10,
    projectionYears: 7,
    cruiseYear: 3,

    netProfitYear1: 0,
    netProfitYear2: 0,
    netProfitYear3: 0,
    profitabilityAnalysis: "",

    // 9. FFOM
    strengths: "Expertise technique pointue, réseau professionnel étendu, coûts de structure légers.",
    weaknesses: "Petite équipe au démarrage, dépendance aux plateformes tierces (Google, FB).",
    opportunities: "Digitalisation massive de l'économie, subventions gouvernementales pour la tech.",
    threats: "Arrivée d'agences internationales, hausse des coûts publicitaires.",

    // 10. Conclusion
    conclusion: "",
    editorAdvice: "",

    // Legacy
    companyName: "DigiTech Solutions",
    industry: "Services informatiques",
    missionStatement: "Accompagner la transformation digitale des entreprises tunisiennes.",
};
