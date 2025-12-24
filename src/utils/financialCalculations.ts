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

    // 3. ROI (Cruise Year)
    const cruiseIdx = Math.min(Math.max((data.cruiseYear || 3) - 1, 0), years.length - 1);
    const cruiseYearData = years[cruiseIdx];
    const roi = totalInvestment > 0 ? (cruiseYearData.netResult / totalInvestment) * 100 : 0;

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
    const growthFactorVentes = Math.pow(1 + (data.turnoverGrowthRate || 0) / 100, yearOffset);
    const growthFactorCharges = Math.pow(1 + (data.expensesGrowthRate || 0) / 100, yearOffset);

    const turnover = (data.products || []).reduce((sum, item) => sum + (item.priceUnit * item.quantityAnnual), 0) * growthFactorVentes;
    const materialsCost = (data.rawMaterials || []).reduce((sum, item) => sum + (item.costUnit * item.quantityAnnual), 0) * growthFactorCharges;

    const { cnss, tfp, foprolos, totalCost: personnelCost, totalGrossSalary } = calculatePersonnelCost(
        data.personnel || [],
        data.socialChargesRate || 0,
        data.tfpRate,
        data.foprolosRate,
        yearOffset + 1
    );

    const yearlyPersonnelCost = personnelCost * growthFactorCharges;
    const yearlyCNSS = cnss * growthFactorCharges;
    const yearlyTFP = tfp * growthFactorCharges;
    const yearlyFOPROLOS = foprolos * growthFactorCharges;
    const yearlyGrossSalary = totalGrossSalary * growthFactorCharges;

    const servicesExterieursTotal = (
        (data.externalCharges?.rent || 0) +
        (data.externalCharges?.utilities || 0) +
        (data.externalCharges?.maintenance || 0) +
        (data.externalCharges?.insurance || 0) +
        (data.externalCharges?.fuel || 0)
    ) * growthFactorCharges;

    const autresServicesExterieursTotal = (
        (data.externalCharges?.telecom || 0) +
        (data.externalCharges?.advertising || 0) +
        (data.externalCharges?.bankFees || 0) +
        (data.externalCharges?.other || 0)
    ) * growthFactorCharges;

    const externalChargesTotal = servicesExterieursTotal + autresServicesExterieursTotal;

    const amortization = calculateAmortization(data.equipments || [], yearOffset);
    // Use the interest from the schedule
    const financialCharges = loanInterest;

    const tcl = turnover * (data.tclRate / 100);
    const itemizedTaxes = tcl + (data.stampsAndRegistration || 0);

    const totalExpenses = materialsCost + yearlyPersonnelCost + externalChargesTotal + amortization + financialCharges;
    const preTaxIncome = turnover - totalExpenses;

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
                corporateTax = calculateProgressiveTax(preTaxIncome);
            } else {
                corporateTax = preTaxIncome * (data.taxRate / 100);
            }
        }

        // Minimum d'impôt
        let minTax = 0;
        if (data.legalStructure === 'PP') {
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
