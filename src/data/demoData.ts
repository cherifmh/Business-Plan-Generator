
import { BusinessPlanData } from "@/types/businessPlan";

export const demoData: BusinessPlanData = {
    // ─────────────────────────────────────────────
    // 1. Informations du Promoteur
    // ─────────────────────────────────────────────
    promoterName: "Ahmed Ben Salah",
    promoterBirthDate: "1985-05-12",
    promoterBirthPlace: "Tunis",
    promoterCin: "08123456",
    promoterCinDate: "2010-06-20",
    promoterAge: 39,

    promoterEducationLevel: "universitaire",
    promoterDiploma: "Master en Marketing Digital",
    promoterDiplomaYear: "2018",

    promoterMaritalStatus: "marie",
    promoterMilitaryService: "non_obligatoire",

    promoterAddress: "15 Rue de la République, Ariana",
    promoterPhone: "98765432",
    promoterEmail: "ahmed.bensalah@email.com",

    promoterHousingStatus: "propriete",
    promoterRentAmount: 0,

    // Informations Famille
    promoterFatherFunction: "Retraité - Fonctionnaire",
    promoterFatherIncome: 800,
    promoterMotherFunction: "Femme au foyer",
    promoterMotherIncome: 0,
    promoterSpouseFunction: "Enseignante",
    promoterSpouseIncome: 1200,

    // Situation Financière Personnelle
    promoterOtherResources: "Revenus locatifs d'un appartement",
    promoterOtherResourcesAmount: 500,
    promoterOtherCharges: "Prêt immobilier remboursé",
    promoterOtherChargesAmount: 0,
    promoterGuarantee: "Appartement personnel estimé à 180 000 TND",

    // ─────────────────────────────────────────────
    // 2. Qualifications & Expérience
    // ─────────────────────────────────────────────
    hasScientificQualifications: true,
    hasProfessionalQualifications: true,
    hasExperience: true,

    scientificDiplomas: [
        { diplomaName: "Licence en Gestion", institution: "IHEC Carthage", yearObtained: "2008" },
        { diplomaName: "Master Professionnel en Marketing Digital", institution: "ISG Tunis", yearObtained: "2018" }
    ],
    professionalDiplomas: [
        { diplomaName: "Google Ads Professional Certification", institution: "Google Academy", yearObtained: "2019" },
        { diplomaName: "HubSpot Inbound Marketing Certified", institution: "HubSpot Academy", yearObtained: "2020" },
        { diplomaName: "Expert SEO Certifié", institution: "SEMrush Academy", yearObtained: "2021" }
    ],
    trainings: ["CEFE", "GERME"],
    otherTrainings: ["Formation Communication Non-Violente", "Gestion de projet Agile (Scrum Master)"],
    experienceYears: 12,
    experienceItems: [
        { position: "Responsable Marketing Digital", institution: "Digital Agency TN", duration: "5 ans", startDate: "2018", endDate: "2023" },
        { position: "Consultant Senior SEO/SEA", institution: "Web Solutions Tunisie", duration: "4 ans", startDate: "2014", endDate: "2018" },
        { position: "Chargé de Communication", institution: "Orange Tunisie", duration: "3 ans", startDate: "2011", endDate: "2014" }
    ],

    qualifications: "Expert en marketing digital (SEO, SEA, Social Media) avec une double compétence en gestion d'entreprise et management d'équipe de 8 personnes.",
    experience: "12 ans d'expérience cumulée dont 5 ans en tant que Responsable Marketing Digital dans une agence de premier plan à Tunis, gérant des budgets publicitaires de plus de 500 000 TND/an.",

    // ─────────────────────────────────────────────
    // 3. Le Projet
    // ─────────────────────────────────────────────
    projectTitle: "DigiTech Solutions",
    projectDescription: "DigiTech Solutions est une agence de conseil en transformation numérique dédiée à l'accompagnement des PME tunisiennes dans leur transition digitale. Nous proposons un audit complet de la présence en ligne, la mise en œuvre de stratégies d'acquisition (Google Ads, Social Ads, SEO), le développement de plateformes e-commerce optimisées et la formation des équipes internes. Notre valeur ajoutée réside dans une approche 100% orientée ROI (Retour sur Investissement) et l'utilisation d'outils d'Intelligence Artificielle pour l'optimisation des campagnes en temps réel.",
    projectLocation: "Lac 2, Tunis",
    legalStructure: "SARL",
    projectNature: "creation",
    projectAreaSize: 85,
    investmentCost: 45000,

    // Profil d'activité
    projectSector: "Services",
    activityType: "Activité digitale",
    revenueModel: "Mixte",
    salesChannel: "Hybride",
    customerType: ["B2B"],

    hasProjectAdvantages: true,
    projectAdvantages: "Label Startup Act en cours d'obtention (exonération IS pendant 8 ans), subvention emploi diplômés de l'enseignement supérieur (programme CAIP), accès au programme de mise à niveau FAMEX pour l'export.",

    hasProjectAuthorizations: true,
    projectAuthorizations: "Déclaration de projet déposée auprès de l'API (réf. 2024/API/12345), cahier des charges activité de service informatique signé, enregistrement RNE en cours.",

    projectExploitationMode: "location",
    projectRentCost: 1200,

    // ─────────────────────────────────────────────
    // 4. Le Crédit
    // ─────────────────────────────────────────────
    loanAmount: 25000,
    loanDuration: 60,
    loanInterestRate: 10,
    loanPurpose: "Financement partiel des équipements technologiques de pointe (stations de travail, serveur, licences) et constitution du fonds de roulement initial pour couvrir les 6 premiers mois d'activité de l'agence.",
    loanJustification: "Le projet nécessite un investissement technologique initial fort pour garantir une qualité de service premium à la clientèle B2B. L'apport personnel de 20 000 TND couvre 44% des besoins totaux, démontrant l'engagement du promoteur. Le crédit sollicité présente un ratio dette/fonds propres de 1,25 conforme aux standards bancaires.",

    // ─────────────────────────────────────────────
    // 5. Centrale de Risque
    // ─────────────────────────────────────────────
    hasBtsCredit: false,
    btsCreditDetails: "",
    hasBankCredit: false,
    bankCreditDetails: "",
    hasGuarantees: true,
    guaranteesDetails: "Garantie SOTUGAR demandée à hauteur de 60% du montant du crédit (15 000 TND), caution solidaire et personnelle du promoteur sur l'ensemble de ses biens meubles et immeubles.",

    // ─────────────────────────────────────────────
    // 6. Investissement & Financement
    // ─────────────────────────────────────────────
    // Équipements : HT total = 22 000 TND → TTC = 26 180 TND
    // + Frais établissement 2 500 + BFR 16 320 = TOTAL EMPLOIS 45 000 TND
    // = Apport personnel 20 000 + Crédit bancaire 25 000 → ÉQUILIBRE PARFAIT ✓
    equipments: [
        { name: "Stations de travail High-End (x3)", priceUnitHT: 4000, quantity: 3, tvaRate: 19, duration: 3 },
        { name: "Serveur local NAS & matériel réseau", priceUnitHT: 3000, quantity: 1, tvaRate: 19, duration: 5 },
        { name: "Mobilier de bureau ergonomique (open space)", priceUnitHT: 3500, quantity: 1, tvaRate: 19, duration: 5 },
        { name: "Logiciels professionnels (Adobe, SEMrush, HubSpot)", priceUnitHT: 2000, quantity: 1, tvaRate: 19, duration: 3 },
        { name: "Équipement audiovisuel (caméra, micro, éclairage)", priceUnitHT: 1500, quantity: 1, tvaRate: 19, duration: 3 }
    ],
    startupCosts: 2500,
    workingCapital: 16320,

    personalContribution: 20000,
    grantAmount: 0,
    dotation: 0,
    bankLoan: 25000,
    otherFunding: 0,

    investmentTotal: 45000,  // 26 180 TTC équip. + 2 500 frais étab. + 16 320 BFR = 45 000 ✓
    externalFunding: 25000,
    investmentBreakdown: "Fonds propres : 44,4% (20 000 TND), Crédit Bancaire : 55,6% (25 000 TND). Total emplois = Équipements TTC 26 180 + Frais d'établissement 2 500 + BFR 16 320 = 45 000 TND.",

    // ─────────────────────────────────────────────
    // 7. Étude de Marché
    // ─────────────────────────────────────────────
    marketStudy: "Le marché du marketing digital en Tunisie enregistre une croissance annuelle de 18% portée par la nécessité impérative pour les PME de se digitaliser face à la pression concurrentielle internationale. L'analyse révèle une carence structurelle en agences spécialisées 'Performance Marketing' capables d'offrir des garanties chiffrées sur le ROI. Notre zone de chalandise principale (Lac 2, Berges du Lac) regroupe plus de 1 200 entreprises cibles à fort potentiel, avec un taux de pénétration digitale estimé à seulement 35%, représentant un marché adressable de 25 M TND/an.",
    marketingStrategy: "Stratégie 'Inbound Marketing & ABM (Account-Based Marketing)' : (1) Création d'un blog expert référencé sur les 50 mots-clés B2B à fort volume, (2) Partenariats stratégiques avec les banques (BTS, BFPME, Enda) pour accompagner leurs clients PME, (3) Prospection ciblée sur LinkedIn Ads avec budget initial de 500 TND/mois, (4) Offre de lancement 'Audit de visibilité digitale gratuit' (valeur 1 200 TND), (5) Présence aux salons professionnels (Tunisia Tech Forum, Forum de l'Entreprise).",
    manufacturingProcess: "Processus de delivery en 5 étapes : (1) Audit initial et diagnostic complet de la présence digitale (48h), (2) Co-définition des KPIs et signature du contrat de performance, (3) Déploiement des campagnes et mise en place des outils de tracking (J+7), (4) Optimisation hebdomadaire pilotée par algorithmes IA (Google Performance Max), (5) Reporting mensuel transparent via dashboard dynamique partagé en temps réel.",
    productsDescription: "Trois lignes de services complémentaires : (A) Forfait 'Performance Mensuel' - gestion complète des campagnes SEA/SMA avec reporting mensuel. (B) Projet 'Web & E-commerce' - conception et développement de sites vitrines et boutiques en ligne SEO-friendly. (C) 'Audit & Stratégie Digitale' - diagnostic complet + feuille de route sur 12 mois. (D) Formations intra-entreprise au marketing digital.",
    targetAudience: "PME et ETI tunisiennes réalisant un chiffre d'affaires entre 500 000 TND et 5 M TND, opérant dans les secteurs du commerce, de l'industrie et des services, souhaitant accélérer leur croissance via le digital. Profil décisionnaire : Directeur Commercial ou PDG, 35-55 ans, conscient de l'enjeu digital mais manquant d'expertise interne.",
    locationDescription: "Implantation stratégique au Lac 2 (Tunis), centre névralgique des affaires tunisiennes concentrant les sièges sociaux de multinationales et de PME premium. La proximité avec les zones d'activités (Centre Urbain Nord, La Marsa) favorise le networking B2B et réduit les délais de déplacement client. Espace de travail moderne de 85 m² en open space aménagé pour 6 postes de travail et une salle de réunion équipée.",
    salesBreakdown: "Répartition prévisionnelle du CA en année de croisière : Forfaits Mensuels Performance (récurrent) : 50%, Projets Web/E-commerce (one-shot) : 30%, Audit & Conseil Stratégique : 15%, Formation intra-entreprise : 5%.",
    purchasingBreakdown: "Structure des achats : Abonnements SaaS et licences logicielles (Google Workspace, SEMrush, Adobe CC, HubSpot) : 55%, Sous-traitance technique ponctuelle (développeurs freelance) : 25%, Fournitures et consommables : 10%, Frais de déplacement professionnels : 10%.",
    suppliers: "Dell Tunisie (matériel informatique), Microsoft Azure & Google Cloud (hébergement cloud), Adobe Systems (licences créatives), SEMrush Ltd (outils SEO), HubSpot Inc (CRM & automatisation), Revendeurs agréés de mobilier de bureau (Bureau Moderne Tunis).",

    // ─────────────────────────────────────────────
    // 8. Rentabilité & Croisière
    // ─────────────────────────────────────────────
    rawMaterials: [],
    rawMaterialsCostMode: 'percentage',
    rawMaterialsCostPercentage: 0,

    personnel: [
        { position: "Community Manager & Content Creator", salaryBrut: 1250, count: 2, monthsWorked: 12, startYear: 1 },
        { position: "Développeur Full-Stack (Web & E-commerce)", salaryBrut: 1800, count: 1, monthsWorked: 12, startYear: 1 },
        { position: "Assistant(e) Commercial(e) & Admin", salaryBrut: 900, count: 1, monthsWorked: 12, startYear: 2 }
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
        other: 2400
    },

    // CA An1 = 89 600 + 45 000 + 15 000 + 6 400 = 156 000 TND
    // Progression +7%/an : An2=166 920 | An3=178 604 | An7≈234 200
    // BEP An1 ≈72% du CA (<75% ✓) | TRI≈70%+ | VAN@12%>0 ✓
    products: [
        { name: "Forfait Mensuel Performance (SEA/SMA)", priceUnit: 800, quantityAnnual: 112 },
        { name: "Projet Web / E-commerce clé en main", priceUnit: 3000, quantityAnnual: 15 },
        { name: "Audit & Stratégie Digitale", priceUnit: 1000, quantityAnnual: 15 },
        { name: "Formation intra-entreprise (journée)", priceUnit: 800, quantityAnnual: 8 }
    ],

    // Fiscalité
    taxRegime: 'reel',
    fixedTaxes: 0,
    taxRate: 15,
    tfpRate: 1,
    foprolosRate: 1,
    tclRate: 0.2,
    stampsAndRegistration: 600,

    // Prévisions
    turnoverGrowthRate: 7,       // +7%/an (croissance maîtrisée, réaliste marché TN)
    expensesGrowthRate: 5,       // +5%/an (inflation + montée en charge)
    discountRate: 12,            // Taux d'actualisation bancaire standard BFPME/BTS
    projectionYears: 7,
    cruiseYear: 3,
    includeYearZero: false,

    // Résultats calculés (mis à jour dynamiquement par l'application)
    // CA An1=156 000 | An2=166 920 | An3=178 604 (croissance 7%/an)
    // TRI≈70%+ | VAN@12%>0 ✓ | BEP An1≈72% (<75% ✓) | Plan financement : ÉQUILIBRÉ ✓
    turnoverYear1: 156000,
    turnoverYear2: 166920,
    turnoverYear3: 178604,
    netProfitYear1: 0,
    netProfitYear2: 0,
    netProfitYear3: 0,
    profitabilityAnalysis: "Le seuil de rentabilité est atteint dès la première année d'exploitation (ratio An1 ≈72% du CA, sous le seuil critique de 75%). La marge nette progresse chaque année sous l'effet d'une croissance du CA (+7%/an) supérieure à la progression des charges (+5%/an). Avec un taux d'actualisation de 12%, la VAN est largement positive et le TRI nettement supérieur au coût du capital, attestant la bankabilité solide du projet sur 7 ans.",

    // ─────────────────────────────────────────────
    // 9. Analyse FFOM (SWOT)
    // ─────────────────────────────────────────────
    strengths: "Profil promoteur senior avec 12 ans d'expérience sectorielle et triple certification internationale. Modèle économique récurrent (abonnements) assurant une visibilité sur les revenus. Localisation premium au cœur du hub d'affaires de Tunis. Maîtrise des outils d'IA pour l'optimisation des campagnes (avantage concurrentiel technologique). Offre 360° couvrant toute la chaîne de valeur digitale.",
    weaknesses: "Démarrage avec une équipe restreinte de 3 personnes, limitant la capacité de traitement simultanée des projets. Notoriété de marque nulle en phase de lancement, nécessitant un effort commercial intensif les 6 premiers mois. Dépendance partielle aux plateformes tierces (Google, Meta) pour la génération de leads.",
    opportunities: "Accélération de la transition digitale des PME tunisiennes post-COVID (+35% de demande en 2 ans). Dispositifs étatiques de soutien à la digitalisation (programme Tunisia Digital 2025). Forte croissance du e-commerce tunisien (+42% en 2023). Possibilité d'élargissement vers les marchés MENA (Algérie, Libye) dans une deuxième phase.",
    threats: "Volatilité des coûts publicitaires sur Google & Meta (hausse des CPC de 20-30% en 3 ans). Concurrence croissante des agences 'low-cost' et des freelances sous-qualifiés tirant les prix vers le bas. Risque de change sur les abonnements SaaS facturés en devises (USD/EUR). Difficulty à fidéliser les talents techniques face aux offres salariales internationales en remote.",

    // ─────────────────────────────────────────────
    // 10. Conclusion & Avis
    // ─────────────────────────────────────────────
    conclusion: "Le projet DigiTech Solutions présente un profil d'investissement solide et des indicateurs de performance financière convaincants : un promoteur senior hautement qualifié, une offre de services répond à une demande structurelle non satisfaite du marché tunisien, un modèle économique mixte (récurrent + one-shot) assurant la résilience du CA, et un montage financier équilibré avec 44% de fonds propres. La rentabilité rapide (année 1) et la forte scalabilité du modèle digital en font une opportunité d'investissement à risque maîtrisé avec un potentiel de croissance exceptionnel sur 7 ans.",
    editorAdvice: "Dossier complet, techniquement convaincant et financièrement robuste. Le profil du promoteur est particulièrement rassurant (12 ans d'expérience, certifications internationales). Recommandé favorablement pour un financement bancaire. Préconisation : accompagnement renforcé sur la partie prospection commerciale au lancement (les 3 premiers mois sont critiques pour la constitution du portefeuille client).",

    // ─────────────────────────────────────────────
    // Champs Legacy / Helper
    // ─────────────────────────────────────────────
    companyName: "DigiTech Solutions SARL",
    industry: "Services informatiques & Marketing Digital",
    missionStatement: "Démocratiser l'accès aux technologies de marketing à haute performance pour accélérer la croissance des PME tunisiennes.",
    executiveSummary: "DigiTech Solutions est une agence digitale B2B basée à Tunis, spécialisée dans l'accompagnement des PME vers la performance en ligne. Fondée par Ahmed Ben Salah, expert reconnu avec 12 ans d'expérience, l'agence vise un CA de 172 800 TND dès la première année grâce à un portefeuille de 10 clients récurrents et 12 projets web.",
    fundingRequired: 25000,
};
