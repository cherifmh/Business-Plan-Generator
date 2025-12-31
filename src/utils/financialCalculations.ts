import { BusinessPlanData, EquipmentItem, PersonnelItem, RawMaterialItem, ExternalCharges, YearlyResults, OperatingResults } from "@/types/businessPlan";

export const calculateInvestment = (equipments: EquipmentItem[]) => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    equipments.forEach(item => {
        const ht = item.priceUnitHT * item.quantity;
        const tva = ht * (item.tvaRate / 100);
        const ttc = ht + tva;

        totalHT += ht;
        totalTVA += tva;
        totalTTC += ttc;
    });

    return { totalHT, totalTVA, totalTTC };
};

export const calculateAmortization = (equipments: EquipmentItem[], yearOffset: number = 0) => {
    let totalAmortization = 0;
    equipments.forEach(item => {
        if (item.duration > yearOffset) {
            const ht = item.priceUnitHT * item.quantity;
            totalAmortization += ht / item.duration;
        }
    });
    return totalAmortization;
};

export const calculatePersonnelCost = (personnel: PersonnelItem[], socialChargesRate: number, tfpRate: number = 2, foprolosRate: number = 1, targetYear: number = 1) => {
    let totalGrossSalary = 0;

    personnel.forEach(p => {
        const startYear = p.startYear || 1;
        if (startYear <= targetYear) {
            // Check if yearly data exists for this specific year
            const yearData = p.yearlyData?.find(yd => yd.year === targetYear);

            if (yearData) {
                // Use yearly data if available
                totalGrossSalary += yearData.salaryBrut * yearData.count * p.monthsWorked;
            } else {
                // Fall back to base values
                totalGrossSalary += p.salaryBrut * p.count * p.monthsWorked;
            }
        }
    });

    const cnss = totalGrossSalary * (socialChargesRate / 100);
    const tfp = totalGrossSalary * (tfpRate / 100);
    const foprolos = totalGrossSalary * (foprolosRate / 100);

    const totalCost = totalGrossSalary + cnss + tfp + foprolos;

    return { totalGrossSalary, cnss, tfp, foprolos, totalCost };
};

export const calculateExternalCharges = (charges: ExternalCharges) => {
    const values = Object.values(charges) as number[];
    return values.reduce((a, b) => a + b, 0);
};

export const calculateFinancialPlan = (data: BusinessPlanData) => {
    const { totalTTC } = calculateInvestment(data.equipments || []);
    const uses = totalTTC + (data.startupCosts || 0) + (data.workingCapital || 0);

    const personal = data.personalContribution || 0;
    const grant = data.grantAmount || 0;
    const dotation = data.dotation || 0;
    const loan = data.bankLoan || 0;
    const other = data.otherFunding || 0;

    const resources = personal + grant + dotation + loan + other;
    const gap = resources - uses;

    return { uses, resources, gap };
};

export const calculateLoanRepayment = (amount: number, durationMonths: number, annualRate: number, projectionYears: number = 3) => {
    if (amount <= 0 || durationMonths <= 0) return [];

    const monthlyRate = (annualRate / 100) / 12;
    // Annuity formula
    const monthlyPayment = monthlyRate > 0
        ? (amount * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) / (Math.pow(1 + monthlyRate, durationMonths) - 1)
        : amount / durationMonths;

    let remainingBalance = amount;
    const schedule = [];

    for (let year = 1; year <= projectionYears; year++) {
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;

        for (let month = 1; month <= 12; month++) {
            if (remainingBalance > 0) {
                const interestPayment = remainingBalance * monthlyRate;
                const principalPayment = Math.min(remainingBalance, monthlyPayment - interestPayment);

                yearlyInterest += interestPayment;
                yearlyPrincipal += principalPayment;
                remainingBalance -= principalPayment;
            }
        }

        schedule.push({
            year,
            principal: yearlyPrincipal,
            interest: yearlyInterest,
            total: yearlyPrincipal + yearlyInterest,
            remainingBalance: Math.max(0, remainingBalance)
        });
    }

    return schedule;
};

export const calculateDetailedAmortization = (equipments: EquipmentItem[], projectionYears: number = 7) => {
    return (equipments || []).map(item => {
        const ht = item.priceUnitHT * item.quantity;
        const annualBase = item.duration > 0 ? ht / item.duration : 0;
        const yearlyValues = [];
        for (let y = 0; y < projectionYears; y++) {
            yearlyValues.push(y < item.duration ? annualBase : 0);
        }
        return {
            name: item.name,
            ht,
            duration: item.duration,
            yearlyValues
        };
    });
};

const calculateProgressiveTax = (income: number) => {
    if (income <= 0) return 0;

    let tax = 0;
    const brackets = [
        { limit: 5000, rate: 0 },
        { limit: 10000, rate: 0.15 },
        { limit: 20000, rate: 0.25 },
        { limit: 30000, rate: 0.30 },
        { limit: 40000, rate: 0.33 },
        { limit: 50000, rate: 0.36 },
        { limit: 70000, rate: 0.38 },
        { limit: Infinity, rate: 0.40 }
    ];

    let remaining = income;
    let prevLimit = 0;

    for (const b of brackets) {
        const range = b.limit - prevLimit;
        const inBracket = Math.min(remaining, range);
        if (inBracket <= 0) break;

        tax += inBracket * b.rate;
        remaining -= inBracket;
        prevLimit = b.limit;
    }
    return tax;
};


export const calculateOperatingResults = (data: BusinessPlanData): OperatingResults => {
    const yearsToProject = data.projectionYears || 7;

    const loanRepayment = calculateLoanRepayment(
        (data.loanAmount || data.bankLoan || 0),
        data.loanDuration || 84,
        data.loanInterestRate || 10,
        yearsToProject
    );

    const years = [];
    for (let i = 0; i < yearsToProject; i++) {
        years.push(calculateYearlyResults(data, i, loanRepayment[i]?.interest || 0));
    }

    // Summary Indicators
    const totalInvestment = (data.equipments || []).reduce((sum, item) => sum + (item.priceUnitHT * item.quantity), 0);

    // 1. VAN (NPV)
    const totalDiscountedCF = years.reduce((sum, y) => sum + y.discountedCashFlow, 0);
    const van = totalDiscountedCF - totalInvestment;

    // 2. Payback Period & Cumulative CF for Charts
    let cumulativeCF = 0;
    const cumulativeCFSeries = [];
    let paybackYears = 0;
    let paybackMonths = 0;
    let recovered = false;

    for (let i = 0; i < years.length; i++) {
        const yearCF = years[i].cashFlow;
        if (!recovered && cumulativeCF + yearCF >= totalInvestment) {
            const needed = totalInvestment - cumulativeCF;
            const fractionOfYear = yearCF > 0 ? needed / yearCF : 0;
            paybackYears = i;
            paybackMonths = Math.ceil(fractionOfYear * 12);
            if (paybackMonths >= 12) {
                paybackYears++;
                paybackMonths = 0;
            }
            recovered = true;
        }
        cumulativeCF += yearCF;
        cumulativeCFSeries.push({ year: i + 1, cumulative: cumulativeCF });
    }

    // Extrapolation if not recovered within projection
    if (!recovered && totalInvestment > 0) {
        const lastYearCF = years[years.length - 1].cashFlow;
        if (lastYearCF > 0) {
            const remaining = totalInvestment - cumulativeCF;
            const extraYears = remaining / lastYearCF;
            paybackYears = years.length + Math.floor(extraYears);
            paybackMonths = Math.ceil((extraYears % 1) * 12);
            if (paybackMonths >= 12) {
                paybackYears++;
                paybackMonths = 0;
            }
            recovered = true;
        }
    }

    // Fallback or "Infinity" marker
    let paybackResult = null;
    if (totalInvestment <= 0) {
        paybackResult = { years: 0, months: 0 };
    } else if (recovered) {
        paybackResult = { years: paybackYears, months: paybackMonths };
    }

    // 3. ROI (TRI / IRR)
    const cruiseIdx = Math.min(Math.max((data.cruiseYear || 3) - 1, 0), years.length - 1);
    const cruiseYearData = years[cruiseIdx];

    // IRR Calculation
    const cashFlows = [-totalInvestment, ...years.map(y => y.cashFlow)];
    const roi = calculateIRR(cashFlows);

    // 4. Break-even Point (Cruise Year)
    const fixedCostsCruise = cruiseYearData.totalExpenses - cruiseYearData.materialsCost + cruiseYearData.totalTaxes - cruiseYearData.corporateTax;
    const variableCostsCruise = cruiseYearData.materialsCost;
    const contributionMarginCruise = cruiseYearData.turnover - variableCostsCruise;
    const breakEvenPoint = contributionMarginCruise > 0 ? (fixedCostsCruise * cruiseYearData.turnover) / contributionMarginCruise : Infinity;

    return {
        years,
        detailedAmortization: calculateDetailedAmortization(data.equipments || [], yearsToProject),
        loanRepayment,
        summary: {
            van,
            payback: paybackResult,
            roi,
            breakEvenPoint,
            totalInvestment,
            fixedCostsCruise,
            variableCostsCruise,
            contributionMarginCruise,
            cruiseYear: data.cruiseYear || 3,
            cruiseYearData
        },
        cumulativeCFSeries,
        cvpData: generateCVPData(cruiseYearData),
        breakEvenEvolution: years.map((y, i) => {
            const fixed = y.totalExpenses - y.materialsCost + y.totalTaxes - y.corporateTax;
            const variable = y.materialsCost;
            const contributionMargin = y.turnover - variable;
            const bep = contributionMargin > 0 ? (fixed * y.turnover) / contributionMargin : 0;
            return { year: i + 1, turnover: y.turnover, breakEvenPoint: bep };
        })
    };
};

export const checkEconomicRatios = (results: OperatingResults, dismissed: string[] = []) => {
    const warnings: { id: string, message: string, type: 'warning' | 'error' }[] = [];
    const cruiseData = results.summary.cruiseYearData;
    const turnover = cruiseData.turnover;

    if (turnover > 0) {
        // 1. Net Margin Check
        const netMargin = (cruiseData.netResult / turnover) * 100;
        if (netMargin < 5 && !dismissed.includes('low_margin')) {
            warnings.push({
                id: 'low_margin',
                message: `La marge nette en année de croisière est très faible (${netMargin.toFixed(1)}%). Vérifiez vos coûts.`,
                type: 'warning'
            });
        }
        if (netMargin > 40 && !dismissed.includes('high_margin')) {
            warnings.push({
                id: 'high_margin',
                message: `La marge nette semble exceptionnellement élevée (${netMargin.toFixed(1)}%). Est-ce réaliste ?`,
                type: 'warning'
            });
        }

        // 2. Personnel Cost Check
        const personnelRatio = (cruiseData.personnelCost / turnover) * 100;
        if (personnelRatio > 60 && !dismissed.includes('high_personnel')) {
            warnings.push({
                id: 'high_personnel',
                message: `Les charges de personnel représentent ${personnelRatio.toFixed(1)}% du CA. C'est très élevé.`,
                type: 'warning'
            });
        }
    }

    return warnings;
};

const generateCVPData = (yearData: YearlyResults) => {
    const turnover = yearData.turnover;
    const fixed = yearData.totalExpenses - yearData.materialsCost + yearData.totalTaxes - yearData.corporateTax;
    const variableRatio = turnover > 0 ? yearData.materialsCost / turnover : 0;

    const steps = 6;
    const data = [];
    for (let i = 0; i <= steps; i++) {
        const x = (turnover * 1.2 * i) / steps;
        data.push({
            percentage: Math.round((x / turnover) * 100),
            revenue: x,
            fixedCosts: fixed,
            totalCosts: fixed + (x * variableRatio)
        });
    }
    return data;
};

const calculateYearlyResults = (data: BusinessPlanData, yearOffset: number, loanInterest: number = 0): YearlyResults => {
    const currentYear = yearOffset + 1;
    const growthFactorVentes = Math.pow(1 + (data.turnoverGrowthRate || 0) / 100, yearOffset);
    const growthFactorCharges = Math.pow(1 + (data.expensesGrowthRate || 0) / 100, yearOffset);

    // Initial Calculations
    let turnover = (data.products || []).reduce((sum, item) => sum + (item.priceUnit * item.quantityAnnual), 0) * growthFactorVentes;

    // Materials: Detailed or Percentage
    let materialsCost = 0;
    if (data.rawMaterialsCostMode === 'percentage' && data.rawMaterialsCostPercentage) {
        materialsCost = turnover * (data.rawMaterialsCostPercentage / 100);
    } else {
        materialsCost = (data.rawMaterials || []).reduce((sum, item) => sum + (item.costUnit * item.quantityAnnual), 0) * growthFactorCharges;
    }

    // Personnel: Detailed or Percentage
    let yearlyPersonnelCost = 0;
    let yearlyGrossSalary = 0;
    let yearlyCNSS = 0;
    let yearlyTFP = 0;
    let yearlyFOPROLOS = 0;

    if (data.personnelCostMode === 'percentage' && data.personnelCostPercentage) {
        yearlyPersonnelCost = turnover * (data.personnelCostPercentage / 100);
        // Approx breakdown for display if needed, though simpler just to show total
        yearlyGrossSalary = yearlyPersonnelCost / (1 + (data.socialChargesRate + data.tfpRate + data.foprolosRate) / 100);
        yearlyCNSS = yearlyGrossSalary * (data.socialChargesRate / 100);
        yearlyTFP = yearlyGrossSalary * (data.tfpRate / 100);
        yearlyFOPROLOS = yearlyGrossSalary * (data.foprolosRate / 100);
    } else {
        const { cnss, tfp, foprolos, totalCost: personnelCost, totalGrossSalary } = calculatePersonnelCost(
            data.personnel || [],
            data.socialChargesRate || 0,
            data.tfpRate,
            data.foprolosRate,
            currentYear
        );
        yearlyPersonnelCost = personnelCost * growthFactorCharges;
        yearlyGrossSalary = totalGrossSalary * growthFactorCharges;
        yearlyCNSS = cnss * growthFactorCharges;
        yearlyTFP = tfp * growthFactorCharges;
        yearlyFOPROLOS = foprolos * growthFactorCharges;
    }

    let servicesExterieursTotal = (
        (data.externalCharges?.rent || 0) +
        (data.externalCharges?.utilities || 0) +
        (data.externalCharges?.maintenance || 0) +
        (data.externalCharges?.insurance || 0) +
        (data.externalCharges?.fuel || 0)
    ) * growthFactorCharges;

    let autresServicesExterieursTotal = (
        (data.externalCharges?.telecom || 0) +
        (data.externalCharges?.advertising || 0) +
        (data.externalCharges?.bankFees || 0) +
        (data.externalCharges?.other || 0)
    ) * growthFactorCharges;

    let amortization = calculateAmortization(data.equipments || [], yearOffset);
    let financialCharges = loanInterest;

    // --- APPLY MANUAL OVERRIDES (Pre-Tax) ---
    // The user can override calculated values. We check for these overrides here.
    if (data.manualProjections && data.manualProjections[yearOffset]) {
        const overrides = data.manualProjections[yearOffset];
        if (overrides.turnover !== undefined) turnover = overrides.turnover;
        if (overrides.materialsCost !== undefined) materialsCost = overrides.materialsCost;
        if (overrides.personnelCost !== undefined) yearlyPersonnelCost = overrides.personnelCost;
        if (overrides.servicesExterieursTotal !== undefined) servicesExterieursTotal = overrides.servicesExterieursTotal;
        if (overrides.autresServicesExterieursTotal !== undefined) autresServicesExterieursTotal = overrides.autresServicesExterieursTotal;
        if (overrides.amortization !== undefined) amortization = overrides.amortization;
        if (overrides.financialCharges !== undefined) financialCharges = overrides.financialCharges;
    }

    const tcl = turnover * (data.tclRate / 100);
    const itemizedTaxes = tcl + (data.stampsAndRegistration || 0);
    const externalChargesTotal = servicesExterieursTotal + autresServicesExterieursTotal;

    const totalExpenses = materialsCost + yearlyPersonnelCost + externalChargesTotal + amortization + financialCharges;
    const preTaxIncome = turnover - totalExpenses;

    // Fiscalité
    let corporateTax = 0;
    if (data.taxRegime === 'forfaitaire') {
        const baseTurnover = 10000;
        const baseTax = 400;
        if (turnover <= baseTurnover) {
            corporateTax = baseTax;
        } else {
            corporateTax = baseTax + (turnover - baseTurnover) * 0.03;
        }
    } else {
        // Régime Réel
        if (preTaxIncome > 0) {
            if (data.legalStructure === 'PP') {
                // IRPP Logic
                corporateTax = calculateProgressiveTax(preTaxIncome);
            } else {
                corporateTax = preTaxIncome * (data.taxRate / 100);
            }
        }

        let minTax = 0;
        if (data.legalStructure === 'PP') {
            // specific min tax for PP if any, usually 0 or modest
            minTax = 0; // Assuming 0 for now unless specified otherwise in TN law context, kept previous logic if needed: 
            // Note: User prompt didn't specify min tax for PP, but standard business practice often suggests a minimum. 
            // Logic from previous code had 300.
            minTax = 300;
        } else if (['SUARL', 'SARL', 'SA'].includes(data.legalStructure)) {
            minTax = 500;
        }
        corporateTax = Math.max(corporateTax, minTax);
    }

    const totalTaxes = corporateTax + itemizedTaxes + (data.fixedTaxes || 0);
    const netResult = preTaxIncome - totalTaxes;

    const cashFlow = netResult + amortization;
    const discountedCashFlow = cashFlow / Math.pow(1 + (data.discountRate || 12) / 100, yearOffset + 1);

    return {
        turnover,
        materialsCost,
        personnelCost: yearlyPersonnelCost,
        totalGrossSalary: yearlyGrossSalary,
        cnss: yearlyCNSS,
        tfp: yearlyTFP,
        foprolos: yearlyFOPROLOS,
        tcl,
        servicesExterieursTotal,
        autresServicesExterieursTotal,
        externalChargesTotal,
        amortization,
        financialCharges,
        totalExpenses,
        preTaxIncome,
        corporateTax,
        totalTaxes,
        netResult,
        cashFlow,
        discountedCashFlow
    };
};

function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
    const maxIterations = 1000;
    const precision = 0.00001;
    let rate = guess;

    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let dNpv = 0;

        for (let t = 0; t < cashFlows.length; t++) {
            const val = cashFlows[t];
            const div = Math.pow(1 + rate, t);

            npv += val / div;
            dNpv += val * (-t * Math.pow(1 + rate, -t - 1));
        }

        if (Math.abs(npv) < precision) {
            return rate * 100;
        }

        if (dNpv === 0) {
            return 0;
        }

        const newRate = rate - npv / dNpv;
        if (Math.abs(newRate) > 100 || isNaN(newRate)) return 0;
        rate = newRate;
    }

    return rate * 100;
}
