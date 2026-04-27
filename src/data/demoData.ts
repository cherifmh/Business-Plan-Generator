
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
        { diplomaName: "Licence en Gestion", institution: "IHEC Carthage", yearObtained: "2008" },
        { diplomaName: "Master Professionnel en Marketing", institution: "ISG Tunis", yearObtained: "2018" }
    ],
    professionalDiplomas: [
        { diplomaName: "Certification Google Ads Professional", institution: "Google Academy", yearObtained: "2019" },
        { diplomaName: "Expert SEO Certifié", institution: "HubSpot", yearObtained: "2020" }
    ],
    trainings: ["CEFE", "GERME"],
    otherTrainings: ["Formation Communication Non-Violente", "Gestion de projet Agile"],
    experienceYears: 12,
    experienceItems: [
        { position: "Manager Marketing", institution: "Digital Agency TN", duration: "5 ans", startDate: "2015" },
        { position: "Consultant Senior", institution: "Web Solutions", duration: "4 ans", startDate: "2011" }
    ],

    qualifications: "Expert en marketing digital (SEO, SEA, Social Media) avec une double compétence en gestion d'entreprise et management d'équipe.",
    experience: "12 ans d'expérience cumulée dont 5 ans en tant que Responsable Marketing dans une agence de premier plan à Tunis.",

    // 3. Projet
    projectTitle: "DigiTech Solutions",
    projectDescription: "DigiTech Solutions est une agence de conseil en transformation numérique dédiée à l'accompagnement des PME tunisiennes. Nous proposons un audit complet de la présence en ligne, la mise en œuvre de stratégies d'acquisition (Google Ads, Social Ads) et le développement de plateformes e-commerce optimisées. Notre valeur ajoutée réside dans une approche axée sur le ROI (Retour sur Investissement) et l'utilisation d'outils d'IA pour l'optimisation des campagnes.",
    projectLocation: "Lac 2, Tunis",
    legalStructure: "SARL",
    projectNature: "creation",
    projectAreaSize: 85,
    investmentCost: 45000,
    hasProjectAdvantages: true,
    projectAdvantages: "Label Startup en cours d'obtention, exonération d'impôts sur les bénéfices (Loi sur l'investissement), subvention pour l'emploi de diplômés de l'enseignement supérieur.",
    hasProjectAuthorizations: true,
    projectAuthorizations: "Déclaration de projet auprès de l'API déposée, Cahier des charges pour l'activité de service informatique signé.",
    projectExploitationMode: "location",
    projectRentCost: 1200,

    // 4. Crédit
    loanAmount: 25000,
    loanDuration: 60,
    loanInterestRate: 10,
    loanPurpose: "Financement partiel des équipements technologiques de pointe et constitution du fonds de roulement initial pour couvrir les 6 premiers mois d'activité.",
    loanJustification: "Le projet nécessite un investissement technologique initial fort pour garantir une qualité de service premium. L'apport personnel couvre 44% des besoins totaux.",

    // 5. Centrale Risque
    hasBtsCredit: false,
    btsCreditDetails: "",
    hasBankCredit: false,
    bankCreditDetails: "",
    hasGuarantees: true,
    guaranteesDetails: "Garantie SOTUGAR demandée à hauteur de 60% du crédit, caution solidaire du promoteur.",

    // 6. Investissement
    equipments: [
        { name: "Stations de travail High-End (x3)", priceUnitHT: 5000, quantity: 3, tvaRate: 19, duration: 3 },
        { name: "Serveur local et matériel réseau", priceUnitHT: 3500, quantity: 1, tvaRate: 19, duration: 5 },
        { name: "Mobilier de bureau ergonomique", priceUnitHT: 4000, quantity: 1, tvaRate: 19, duration: 5 },
        { name: "Logiciels & Licences professionnelles", priceUnitHT: 1500, quantity: 1, tvaRate: 19, duration: 3 }
    ],
    startupCosts: 2500,
    workingCapital: 13940,

    personalContribution: 20000,
    grantAmount: 0,
    dotation: 0,
    bankLoan: 25000,
    otherFunding: 0,

    investmentTotal: 45000,
    externalFunding: 25000,
    investmentBreakdown: "Fonds propres : 44%, Crédit Bancaire : 56%.",

    // 7. Marché
    marketStudy: "Le marché du marketing digital en Tunisie connaît une croissance annuelle de 18% portée par la nécessité pour les PME de se digitaliser. L'analyse montre une carence en agences spécialisées 'Performance' offrant des garanties de résultats. Notre zone de chalandise (Lac 2) regroupe plus de 500 entreprises cibles à fort potentiel de croissance.",
    marketingStrategy: "Stratégie 'Inbound Marketing' via un blog expert, partenariats avec des banques (BTS, BFPME) pour accompagner leurs clients, et prospection ciblée sur LinkedIn Ads. Offre de lancement 'Audit de visibilité gratuit'.",
    manufacturingProcess: "1. Audit initial et diagnostic. 2. Définition des KPIs avec le client. 3. Déploiement des campagnes et outils. 4. Optimisation hebdomadaire par l'IA. 5. Reporting mensuel transparent via dashboard dynamique.",
    productsDescription: "Services d'audit stratégique, gestion de campagnes publicitaires SEA/SMA, développement web SEO-friendly, et formation des équipes internes au digital.",
    targetAudience: "PME et Startups tunisiennes réalisant un CA entre 200k et 2M TND, souhaitant passer à l'échelle supérieure via le digital.",
    locationDescription: "Implantation stratégique au Lac 2, centre névralgique des affaires à Tunis, favorisant le networking et la proximité avec les clients B2B.",
    salesBreakdown: "Maintenance & Conseil (Récurrent) : 50%, Projets One-shot (Web/SEO) : 30%, Régie Ads (Commissions) : 20%.",
    purchasingBreakdown: "Abonnements SaaS (60%), Frais de sous-traitance ponctuelle (20%), Fournitures diverses (20%).",
    suppliers: "Dell Tunisie, Microsoft (Azure), Google Cloud, Revendeurs locaux de mobilier de bureau.",

    // 8. Rentabilité
    rawMaterials: [],
    personnel: [
        { position: "Community Manager", salaryBrut: 1250, count: 2, monthsWorked: 12, startYear: 1 },
        { position: "Développeur Full-Stack", salaryBrut: 1800, count: 1, monthsWorked: 12, startYear: 1 },
        { position: "Assistant Commercial", salaryBrut: 850, count: 1, monthsWorked: 12, startYear: 2 }
    ],
    socialChargesRate: 17.07,
    externalCharges: {
        rent: 14400,
        utilities: 2400,
        maintenance: 1200,
        insurance: 1500,
        fuel: 1800,
        telecom: 3600,
        advertising: 6000,
        bankFees: 600,
        other: 2000
    },
    products: [
        { name: "Forfait Mensuel Performance", priceUnit: 850, quantityAnnual: 120 },
        { name: "Projet Web / E-commerce", priceUnit: 3500, quantityAnnual: 12 },
        { name: "Audit & Stratégie Digitale", priceUnit: 1200, quantityAnnual: 24 }
    ],

    taxRegime: 'reel',
    fixedTaxes: 0,
    taxRate: 15,
    tfpRate: 1,
    foprolosRate: 1,
    tclRate: 0.2,
    stampsAndRegistration: 600,
    turnoverGrowthRate: 20,
    expensesGrowthRate: 5,
    discountRate: 10,
    projectionYears: 7,
    cruiseYear: 3,

    turnoverYear1: 172800,
    turnoverYear2: 207360,
    turnoverYear3: 248832,
    netProfitYear1: 0,
    netProfitYear2: 0,
    netProfitYear3: 0,
    profitabilityAnalysis: "Le seuil de rentabilité est atteint dès la fin de la première année d'activité. La marge nette se stabilise autour de 22% en année de croisière (Y3), ce qui témoigne d'une excellente maîtrise des coûts opérationnels.",

    // 9. FFOM
    strengths: "Maîtrise technologique avancée, profil du promoteur senior, localisation premium, modèle économique récurrent (abonnements).",
    weaknesses: "Démarrage avec une équipe restreinte, besoin initial de prospection intensive pour installer la marque.",
    opportunities: "Accélération du e-commerce en Tunisie, dispositifs de soutien à la digitalisation (programmes nationaux).",
    threats: "Volatilité des coûts publicitaires internationaux, concurrence des agences 'low-cost'.",

    // 10. Conclusion
    conclusion: "Le projet DigiTech Solutions présente tous les indicateurs de réussite : un promoteur expérimenté, une offre répondant à un besoin critique du marché et un montage financier équilibré. La rentabilité rapide et la scalabilité du modèle en font une opportunité d'investissement solide avec un risque maîtrisé.",
    editorAdvice: "Dossier complet et techniquement convaincant. Recommandé pour un financement bancaire avec un accompagnement sur la partie commerciale au lancement.",

    // Legacy
    companyName: "DigiTech Solutions",
    industry: "Services informatiques & Marketing",
    missionStatement: "Démocratiser l'accès aux technologies de marketing à haute performance pour les PME tunisiennes.",
};
