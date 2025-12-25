import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType, ImageRun, PageBreak } from "docx";
import { saveAs } from "file-saver";
import { BusinessPlanData, ExportFormat, AmortizationRow, LoanRepaymentRow } from "@/types/businessPlan";
import { calculateInvestment, calculateFinancialPlan, calculateOperatingResults } from "./financialCalculations";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

// Formats number with '.' as decimal separator and 3 decimal places (millimes)
const formatAmount = (value: number | undefined): string => {
  if (value === undefined) return "0.000";
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

const formatCurrency = (value: number | undefined): string => {
  return formatAmount(value) + " TND";
};

const formatLegalStructure = (value: string | undefined): string => {
  if (!value) return "Non spécifié";
  const structures: Record<string, string> = {
    PP: "Personne Physique",
    SUARL: "SUARL",
    SARL: "SARL",
    SA: "SA",
    "Auto entrepreneur": "Auto entrepreneur",
  };
  return structures[value] || value;
};

const formatText = (text: string | undefined): string => {
  if (!text) return "";
  return text.replace(/\s*:\s*/g, " : ");
};

export const exportToPDF = (data: BusinessPlanData): void => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 25; // 2.5 cm = ~25mm
  let yPosition = 25;

  // Helpers
  const addTitle = (text: string) => {
    pdf.setFontSize(16); // 16pt for Main Title
    pdf.setTextColor(0, 102, 204);
    pdf.setFont("helvetica", "bold");
    const formatted = formatText(text);
    const textWidth = pdf.getTextWidth(formatted);
    pdf.text(formatted, (pageWidth - textWidth) / 2, yPosition);
    yPosition += 15;
  };

  const addHeader = (text: string) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 25;
    }
    pdf.setFontSize(14); // 14pt (Heading 2 equivalent)
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(0, 51, 102);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 10, "F");
    pdf.setFont("helvetica", "bold");
    pdf.text(formatText(text.toUpperCase()), margin + 5, yPosition + 7);
    yPosition += 18;
    pdf.setTextColor(0, 0, 0);
  };

  const addFooter = () => {
    const pageCount = pdf.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.text(`Plan d'Affaires - ${data.projectTitle || "BP"} - Page ${i} sur ${pageCount}`, pageWidth / 2, 290, { align: "center" });
    }
  };

  const addField = (label: string, value: string | number | undefined) => {
    const content = value?.toString() || "Non renseigné";
    pdf.setFontSize(11); // 11pt Body
    pdf.setFont("helvetica", "bold");
    const cleanLabel = formatText(label);
    pdf.text(cleanLabel + " :", margin, yPosition);

    pdf.setFont("helvetica", "normal");
    const labelWidth = pdf.getTextWidth(cleanLabel + " : ");
    // Ensure justification or at least wrapping fits nicely
    const lines = pdf.splitTextToSize(formatText(content), pageWidth - 2 * margin - labelWidth);

    lines.forEach((line: string, index: number) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 25;
        // Reprint label on new page? No, just continue content.
        if (index === 0) pdf.text(cleanLabel + " :", margin, yPosition); // Only if we broke exactly at line 0?
        // Actually simplified: just continue text
      }

      // If it's the first line, offset by label width
      if (index === 0) {
        pdf.text(line, margin + labelWidth, yPosition);
      } else {
        pdf.text(line, margin, yPosition);
      }

      // Line height 1.15 approx. For 11pt (~3.88mm), 1.15 is ~4.5mm. Let's use 5mm.
      yPosition += 5;
    });
    yPosition += 3; // Extra spacing after field
  };

  const addLongText = (label: string, value: string | undefined) => {
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 51, 102);
    pdf.text(label.toUpperCase() + " :", margin, yPosition);
    yPosition += 6;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    const content = value || "Non renseigné";
    const lines = pdf.splitTextToSize(content, pageWidth - 2 * margin);
    lines.forEach((line: string) => {
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 8;
  };

  // --- PAGE DE GARDE ---
  pdf.setFillColor(0, 51, 102);
  pdf.rect(0, 0, pageWidth, 60, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(32);
  pdf.setFont("helvetica", "bold");
  pdf.text("BUSINESS PLAN", pageWidth / 2, 35, { align: "center" });

  yPosition = 100;
  pdf.setTextColor(0, 51, 102);
  pdf.setFontSize(26);
  const titleLines = pdf.splitTextToSize(data.projectTitle || "SANS TITRE", pageWidth - 40);
  pdf.text(titleLines, pageWidth / 2, yPosition, { align: "center" });
  yPosition += (titleLines.length * 12) + 20;

  pdf.setDrawColor(0, 51, 102);
  pdf.setLineWidth(1);
  pdf.line(margin * 2, yPosition, pageWidth - margin * 2, yPosition);
  yPosition += 25;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "normal");
  pdf.text(`PROJET PRÉSENTÉ PAR :`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(data.promoterName || "Non spécifié", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 30;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`FORME JURIDIQUE : ${formatLegalStructure(data.legalStructure).toUpperCase()}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;
  pdf.text(`LOCALISATION : ${data.projectLocation || "Non spécifié"}`, pageWidth / 2, yPosition, { align: "center" });

  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} via Business Plan Genie`, pageWidth / 2, 280, { align: "center" });

  // --- SECTION 1: PROMOTEUR ---
  pdf.addPage();
  yPosition = 20;
  addHeader("1. INFORMATIONS SUR LE PROMOTEUR");
  addField("Nom et Prénom", data.promoterName);
  addField("Date et Lieu de Naissance", `${data.promoterBirthDate} à ${data.promoterBirthPlace}`);
  addField("Numéro CIN", data.promoterCin);
  addField("Délivrée le", data.promoterCinDate);
  addField("Adresse", data.promoterAddress);
  addField("Téléphone", data.promoterPhone);
  addField("Email", data.promoterEmail);
  addField("Niveau d'instruction", data.promoterEducationLevel);
  addField("Diplôme principal", data.promoterDiploma);
  addField("Situation Familiale", data.promoterMaritalStatus);
  addField("Service Militaire", data.promoterMilitaryService);
  addField("Logement", data.promoterHousingStatus);

  // --- SECTION 2 & 3: QUALIFICATIONS ---
  addHeader("2 & 3. QUALIFICATIONS ET EXPÉRIENCES");
  if (data.scientificDiplomas && data.scientificDiplomas.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Diplômes Scientifiques / Professionnels :", margin, yPosition);
    yPosition += 5;
    autoTable(pdf, {
      startY: yPosition,
      head: [['Diplôme', 'Établissement', 'Année']],
      body: data.scientificDiplomas.map(d => [d.diplomaName, d.institution, d.yearObtained]),
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
    });
    yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }

  if (data.experienceItems && data.experienceItems.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Expériences Professionnelles Détallées :", margin, yPosition);
    yPosition += 5;
    autoTable(pdf, {
      startY: yPosition,
      head: [['Poste', 'Organisme', 'Durée', 'Période']],
      body: data.experienceItems.map(e => [e.position, e.institution, e.duration, `${e.startDate || ""} - ${e.endDate || ""}`]),
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
    });
    yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }

  // --- SECTION 4: PROJET ---
  addHeader("4. PRÉSENTATION DU PROJET");
  addField("Titre du Projet", data.projectTitle);
  addField("Localisation", data.projectLocation);
  addField("Nature du Projet", data.projectNature);
  addField("Superficie Local", data.projectAreaSize + " m²");
  addField("Structure Juridique", formatLegalStructure(data.legalStructure));
  addLongText("Description de l'activité", data.projectDescription);
  addLongText("Avantages du projet", data.projectAdvantages);
  addLongText("Autorisations administratives", data.projectAuthorizations);

  // --- SECTION 5: CENTRALE RISQUE ---
  addHeader("5. CENTRALE DES RISQUES ET GARANTIES");
  addField("Crédit BTS en cours", data.hasBtsCredit ? "OUI" : "NON");
  if (data.hasBtsCredit) addLongText("Détails BTS", data.btsCreditDetails);
  addField("Crédit Système Bancaire en cours", data.hasBankCredit ? "OUI" : "NON");
  if (data.hasBankCredit) addLongText("Détails Bancaires", data.bankCreditDetails);
  addField("Garanties réelles prévues", data.hasGuarantees ? "OUI" : "NON");
  if (data.hasGuarantees) addLongText("Détails des garanties", data.guaranteesDetails);

  // --- SECTION 6: INVESTISSEMENT ---
  pdf.addPage();
  yPosition = 20;
  addHeader("6. PLAN D'INVESTISSEMENT ET DE FINANCEMENT");

  if (data.equipments && data.equipments.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.text("6.1 Détail des Investissements (Équipements) (en TND) :", margin, yPosition);
    yPosition += 5;
    autoTable(pdf, {
      startY: yPosition,
      head: [['Désignation', 'Prix HT', 'Qté', 'TVA', 'Total TTC']],
      body: data.equipments.map(e => [
        e.name,
        formatAmount(e.priceUnitHT),
        e.quantity,
        e.tvaRate + "%",
        formatAmount(e.priceUnitHT * e.quantity * (1 + e.tvaRate / 100))
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      columnStyles: { 1: { halign: 'right' }, 4: { halign: 'right' } }
    });
    yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }

  const finPlan = calculateFinancialPlan(data);
  const invRes = calculateInvestment(data.equipments || []);

  pdf.setFont("helvetica", "bold");
  pdf.text("6.2 Schéma de Financement (Plan Global) (en TND) :", margin, yPosition);
  yPosition += 5;
  autoTable(pdf, {
    startY: yPosition,
    head: [['BESOINS (Emplois)', 'Montant', 'RESSOURCES (Financement)', 'Montant']],
    body: [
      ['Investissements TTC', formatAmount(invRes.totalTTC), 'Apport Personnel', formatAmount(data.personalContribution)],
      ['Frais d\'établissement', formatAmount(data.startupCosts), 'Subventions', formatAmount(data.grantAmount)],
      ['Fonds de Roulement', formatAmount(data.workingCapital), 'Dotation', formatAmount(data.dotation)],
      ['', '', 'Crédit Bancaire BTS/BCT', formatAmount(data.bankLoan)],
      ['', '', 'Autres Ressources', formatAmount(data.otherFunding)],
      ['TOTAL DES BESOINS', formatAmount(finPlan.uses), 'TOTAL DES RESSOURCES', formatAmount(finPlan.resources)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
    columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } }
  });
  yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // --- SECTION 7: MARCHÉ ---
  pdf.addPage();
  yPosition = 20;
  addHeader("7. ÉTUDE DE MARCHÉ ET STRATÉGIE COMMERCIALE");
  addLongText("Description des produits/services", data.productsDescription);
  addLongText("Procédé de fabrication / Mode opératoire", data.manufacturingProcess);
  addLongText("Clientèle cible", data.targetAudience);
  addLongText("Marché et Concurrence", data.marketStudy);
  addLongText("Justification du choix de l'emplacement", data.locationDescription);
  addLongText("Stratégie Commerciale (Marketing mix)", data.marketingStrategy);
  addLongText("Ventilation des ventes et délais paiement", data.salesBreakdown);
  addLongText("Ventilation des achats et règlements", data.purchasingBreakdown);
  addLongText("Principaux fournisseurs identifiés", data.suppliers);

  // --- SECTION 8: RENTABILITÉ ---
  pdf.addPage();
  yPosition = 20;
  addHeader("8. ÉTUDE DE RENTABILITÉ DÉTAILLÉE");

  const results = calculateOperatingResults(data);
  const cruise = results.summary.cruiseYearData;

  // 8.1 Chiffre d'Affaires (7 Ans)
  pdf.setFont("helvetica", "bold");
  pdf.text("8.1 Chiffre d'Affaires Prévisionnel (en TND) :", margin, yPosition);
  yPosition += 5;
  autoTable(pdf, {
    startY: yPosition,
    head: [['Année', ...results.years.map((y, i) => `An ${i + 1}`)]],
    body: [
      ['Chiffre d\'Affaires', ...results.years.map(y => formatAmount(y.turnover))]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
    columnStyles: results.years.reduce((acc: Record<number, { halign: 'right' | 'left' | 'center' }>, _, i) => {
      acc[i + 1] = { halign: 'right' };
      return acc;
    }, {})
  });
  yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // Raw Materials
  if (data.rawMaterials && data.rawMaterials.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.text("8.2 Achats de Matières Premières & Consommations (en TND) :", margin, yPosition);
    yPosition += 5;
    autoTable(pdf, {
      startY: yPosition,
      head: [['Désignation', ...results.years.map((y, i) => `An ${i + 1}`)]],
      body: data.rawMaterials.map(m => {
        return [m.name, ...results.years.map((y, i) => {
          const growth = Math.pow(1 + (data.expensesGrowthRate || 0) / 100, i);
          return formatAmount(m.costUnit * m.quantityAnnual * growth);
        })];
      }),
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      columnStyles: results.years.reduce((acc: Record<number, { halign: 'right' | 'left' | 'center' }>, _, i) => { acc[i + 1] = { halign: 'right' }; return acc; }, {})
    });
    yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }

  // Personnel
  // Personnel
  if (data.personnel && data.personnel.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.text("8.3 Charges de Personnel & Cotisations (en TND) :", margin, yPosition);
    yPosition += 5;
    autoTable(pdf, {
      startY: yPosition,
      head: [['Poste', ...results.years.map((y, i) => `An ${i + 1}`)]],
      body: data.personnel.map(p => {
        const rows = [p.position];
        results.years.forEach((y, i) => {
          const currentYear = i + 1;
          const startYear = p.startYear || 1;
          if (currentYear < startYear) {
            rows.push("-");
          } else {
            // Check explicit yearly data or use default
            const yd = p.yearlyData?.find(d => d.year === currentYear);
            const count = yd?.count ?? p.count;
            const salary = yd?.salaryBrut ?? p.salaryBrut;
            const growth = Math.pow(1 + (data.expensesGrowthRate || 0) / 100, i);

            // Total Cost = Salary * Count * Months * Growth * Charges
            const base = salary * count * (p.monthsWorked || 12);
            const total = base * growth * (1 + (data.socialChargesRate + data.tfpRate + data.foprolosRate) / 100);
            rows.push(formatAmount(total));
          }
        });
        return rows;
      }),
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      columnStyles: results.years.reduce((acc: Record<number, { halign: 'right' | 'left' | 'center' }>, _, i) => { acc[i + 1] = { halign: 'right' }; return acc; }, {})
    });
    yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }

  // 8.4 Charges Extérieures (Projections)
  pdf.addPage();
  yPosition = 20;
  pdf.setFont("helvetica", "bold");
  pdf.text("8.4 Charges Extérieures (Projections sur 7 ans) (en TND) :", margin, yPosition);
  yPosition += 5;

  const extChargeLabels: Record<string, string> = {
    rent: "Loyer", utilities: "Énergie (Eau, Élec)", maintenance: "Entretien", insurance: "Assurance", fuel: "Carburant",
    telecom: "Télécom", advertising: "Publicité", bankFees: "Frais Bancaires", other: "Divers"
  };

  const extChargeRows = Object.keys(data.externalCharges || {}).map(key => {
    const baseVal = (data.externalCharges as unknown as Record<string, number>)[key] || 0;
    return [
      extChargeLabels[key] || key,
      ...results.years.map((y, i) => {
        const growth = Math.pow(1 + (data.expensesGrowthRate || 0) / 100, i);
        return formatAmount(baseVal * growth);
      })
    ];
  });
  // Add total row
  extChargeRows.push(['TOTAL CHARGES EXT.', ...results.years.map(y => formatAmount(y.externalChargesTotal))]);

  autoTable(pdf, {
    startY: yPosition,
    head: [['Charge', ...results.years.map((y, i) => `An ${i + 1}`)]],
    body: extChargeRows,
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
    styles: { fontSize: 8 },
    columnStyles: results.years.reduce((acc: Record<number, { halign: 'right' | 'left' | 'center' }>, _, i) => { acc[i + 1] = { halign: 'right' }; return acc; }, {})
  });
  yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // 8.5 Fiscalité & Taxes
  pdf.setFont("helvetica", "bold");
  pdf.text("8.5 Fiscalité & Taxes (en TND) :", margin, yPosition);
  yPosition += 5;
  autoTable(pdf, {
    startY: yPosition,
    head: [['Désignation', ...results.years.map((y, i) => `An ${i + 1}`)]],
    body: [
      ['TCL (Taxe Collectivités)', ...results.years.map(y => formatAmount(y.tcl))],
      ['Impôt sur Sociétés', ...results.years.map(y => formatAmount(y.corporateTax))],
      ['TOTAL FISCALITÉ', ...results.years.map(y => formatAmount(y.totalTaxes))]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
    columnStyles: results.years.reduce((acc: Record<number, { halign: 'right' | 'left' | 'center' }>, _, i) => { acc[i + 1] = { halign: 'right' }; return acc; }, {})
  });
  yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // 8.6 Amortissements
  if (results.detailedAmortization && results.detailedAmortization.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.text("8.6 Tableau d'Amortissements Détaillé (en TND) :", margin, yPosition);
    yPosition += 5;
    autoTable(pdf, {
      startY: yPosition,
      head: [['Investissement', 'Valeur', ...results.years.map((y, i) => `An ${i + 1}`)]],
      body: results.detailedAmortization.map(item => [
        item.name,
        formatAmount(item.ht),
        ...item.yearlyValues.map((v: number) => formatAmount(v))
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      styles: { fontSize: 7 },
      columnStyles: results.years.reduce((acc: Record<number, { halign: 'right' | 'left' | 'center' }>, _, i) => { acc[i + 2] = { halign: 'right' }; return acc; }, { 1: { halign: 'right' } })
    });
    yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }

  // 8.7 Charges Financières
  if (results.loanRepayment && results.loanRepayment.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.text("8.7 Tableau des Charges Financières (Crédit) (en TND) :", margin, yPosition);
    yPosition += 5;
    autoTable(pdf, {
      startY: yPosition,
      head: [['Année', 'Principal', 'Intérêts', 'Mensualité', 'Restant Dû']],
      body: results.loanRepayment.map(l => [
        `An ${l.year}`,
        formatAmount(l.principal),
        formatAmount(l.interest),
        formatAmount(l.total),
        formatAmount(l.remainingBalance)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
    });
    yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }

  // Multi-year table (Tableau d'Exploitation Prévisionnel Global)
  pdf.addPage();
  yPosition = 20;
  pdf.setFont("helvetica", "bold");
  pdf.text("8.8 Tableau d'Exploitation Prévisionnel (en TND) :", margin, yPosition);
  yPosition += 5;
  autoTable(pdf, {
    startY: yPosition,
    head: [['Désignation', ...results.years.map((y, i) => `An ${i + 1}`)]],
    body: [
      ['Chiffre d\'Affaires', ...results.years.map(y => formatAmount(y.turnover))],
      ['Achats Matières Premières', ...results.years.map(y => `(${formatAmount(y.materialsCost)})`)],
      ['Charges Personnel (TTC)', ...results.years.map(y => `(${formatAmount(y.personnelCost)})`)],
      ['Services Extérieurs', ...results.years.map(y => `(${formatAmount(y.servicesExterieursTotal)})`)],
      ['Autres Services Extérieurs', ...results.years.map(y => `(${formatAmount(y.autresServicesExterieursTotal)})`)],
      ['Amortissements', ...results.years.map(y => `(${formatAmount(y.amortization)})`)],
      ['Charges Financières', ...results.years.map(y => `(${formatAmount(y.financialCharges)})`)],
      ['TOTAL DES CHARGES', ...results.years.map(y => `(${formatAmount(y.totalExpenses)})`)],
      ['RÉSULTAT AVANT IMPÔT', ...results.years.map(y => formatAmount(y.preTaxIncome))],
      ['Impôts et Fiscalité', ...results.years.map(y => `(${formatAmount(y.totalTaxes)})`)],
      ['RÉSULTAT NET (Bénéfice)', ...results.years.map(y => formatAmount(y.netResult))],
      ['Capacité d\'Autofinancement (CAF)', ...results.years.map(y => formatAmount(y.cashFlow))]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
    styles: { fontSize: 8 },
    columnStyles: results.years.reduce((acc: Record<number, { halign: 'right' | 'left' | 'center' }>, _, i) => {
      acc[i + 1] = { halign: 'right' };
      return acc;
    }, {})
  });
  yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // Cruise Year Specific Table
  pdf.setFont("helvetica", "bold");
  pdf.text(`8.9 Tableau d'Exploitation de l'Année de Croisière (${results.summary.cruiseYear}) (en TND) :`, margin, yPosition);
  yPosition += 5;
  autoTable(pdf, {
    startY: yPosition,
    body: [
      ['CHIFFRE D\'AFFAIRES', formatAmount(cruise.turnover)],
      ['Achats Matières Premières', `(${formatAmount(cruise.materialsCost)})`],
      ['Charges de Personnel (TTC)', `(${formatAmount(cruise.personnelCost)})`],
      ['Services Extérieurs', `(${formatAmount(cruise.servicesExterieursTotal)})`],
      ['Autres Services Extérieurs', `(${formatAmount(cruise.autresServicesExterieursTotal)})`],
      ['Amortissements', `(${formatAmount(cruise.amortization)})`],
      ['Charges Financières', `(${formatAmount(cruise.financialCharges)})`],
      ['RÉSULTAT AVANT IMPÔT', formatAmount(cruise.preTaxIncome)],
      ['Fiscalité & Impôts', `(${formatAmount(cruise.totalTaxes)})`],
      ['RÉSULTAT NET (Bénéfice)', formatAmount(cruise.netResult)],
      ['Capacité d\'Autofinancement (CAF)', formatAmount(cruise.cashFlow)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
  });
  yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // Projection settings (Moved here to be with tables)
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "italic");
  pdf.text(`Note: Les projections sont basées sur un taux de croissance des ventes de ${data.turnoverGrowthRate}% et des charges de ${data.expensesGrowthRate}%.`, margin, yPosition);
  yPosition += 15;

  // Performance Indicators
  pdf.addPage();
  yPosition = 20;
  addHeader("8.10 ANALYSE DE PERFORMANCE ET RENTABILITÉ GLOBALE");

  pdf.setFont("helvetica", "bold");
  pdf.text("Analyse des Coûts (Année Croisière) :", margin, yPosition);
  yPosition += 5;
  autoTable(pdf, {
    startY: yPosition,
    body: [
      ['Frais Fixes', formatAmount(results.summary.fixedCostsCruise)],
      ['Frais Variables', formatAmount(results.summary.variableCostsCruise)],
      ['Marge sur Coût Variable', formatAmount(results.summary.contributionMarginCruise)],
      ['Point Mort (Chiffre d\'Affaires Critique)', formatAmount(results.summary.breakEvenPoint)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
  });
  yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  pdf.setFont("helvetica", "bold");
  pdf.text("Indicateurs de Rentabilité Globale :", margin, yPosition);
  yPosition += 5;
  autoTable(pdf, {
    startY: yPosition,
    body: [
      ['VAN (Valeur Actuelle Nette)', formatAmount(results.summary.van)],
      ['ROI (Retour sur l\'Investissement)', results.summary.roi.toFixed(2) + " %"],
      ['Délai de Récupération du Capital', results.summary.payback ? `${results.summary.payback.years} Ans et ${results.summary.payback.months} Mois` : "Non récupéré"]
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
  });
  yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // Charts Integration (Part of 8.10)
  if (data.chartImages) {
    if (yPosition > 220) {
      pdf.addPage();
      yPosition = 20;
    } else {
      yPosition += 10;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Illustrations Graphiques :", margin, yPosition);
    yPosition += 10;

    const chartHeight = 50;
    const chartWidth = 80;

    // Row 1: BreakEven & Evolution
    if (yPosition + chartHeight > 280) { pdf.addPage(); yPosition = 20; }

    if (data.chartImages.breakEven) {
      pdf.addImage(data.chartImages.breakEven, 'PNG', margin, yPosition, chartWidth, chartHeight);
    }
    if (data.chartImages.breakEvenEvolution) {
      pdf.addImage(data.chartImages.breakEvenEvolution, 'PNG', margin + 90, yPosition, chartWidth, chartHeight);
    }
    yPosition += chartHeight + 10;

    // Row 2: Profitability & CashFlow
    if (yPosition + chartHeight > 280) { pdf.addPage(); yPosition = 20; }

    if (data.chartImages.profitability) {
      pdf.addImage(data.chartImages.profitability, 'PNG', margin, yPosition, chartWidth, chartHeight);
    }
    if (data.chartImages.cashFlow) {
      pdf.addImage(data.chartImages.cashFlow, 'PNG', margin + 90, yPosition, chartWidth, chartHeight);
    }
    yPosition += chartHeight + 10;
  }

  // --- SECTION 9: SWOT ---
  pdf.addPage();
  yPosition = 20;
  addHeader("9. ANALYSE FFOM (SWOT)");
  autoTable(pdf, {
    startY: yPosition,
    head: [['FORCES (Interne)', 'FAIBLESSES (Interne)']],
    body: [[data.strengths || "-", data.weaknesses || "-"]],
    theme: 'grid',
    headStyles: { fillColor: [34, 139, 34] },
  });
  yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 5;
  autoTable(pdf, {
    startY: yPosition,
    head: [['OPPORTUNITÉS (Externe)', 'MENACES (Externe)']],
    body: [[data.opportunities || "-", data.threats || "-"]],
    theme: 'grid',
  });
  yPosition = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // --- SECTION 10: CONCLUSION ---
  addHeader("10. CONCLUSION ET RECOMMANDATIONS");
  addLongText("Conclusion Générale", data.conclusion);
  addLongText("Avis du Rédacteur (Expert)", data.editorAdvice);

  // --- FOOTERS ---
  addFooter();

  // --- SAVE ---
  pdf.save(`Plan_Affaires_${(data.projectTitle || "BP").replace(/\s+/g, "_")}.pdf`);
};

export const exportToDocx = async (data: BusinessPlanData): Promise<void> => {
  const invRes = calculateInvestment(data.equipments || []);
  const finPlan = calculateFinancialPlan(data);
  const results = calculateOperatingResults(data);
  const cruise = results.summary.cruiseYearData;

  // We reuse formatText helper defined above for exportToPDF? 
  // Wait, I defined it outside exportToPDF scope in previous chunk so it is available globally in file if placed correctly.
  // Actually I placed it before exportToPDF, so I don't need to redefine it inside exportToDocx if I move the existing one out or reuse.
  // The existing formatText inside exportToDocx (lines 660-664 in previous state) is local. 
  // I should probably remove the local one in exportToDocx and use the global one if I moved it.
  // But for now, let's just make sure exportToPDF uses the one I added.

  // NOTE: In the previous multi_replace for exportToDocx, I added formatText *inside* exportToDocx. 
  // Now I added a global one. The local one in exportToDocx will shadow it, which is fine, but redundant. 

  // Let's rely on the global formatText I just added.

  // ... (rest of exportToDocx)





  const createHeading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) => {
    let size = 24; // Default Heading 3 (12pt)
    if (level === HeadingLevel.HEADING_1) size = 32; // Heading 1 (16pt)
    else if (level === HeadingLevel.HEADING_2) size = 28; // Heading 2 (14pt)

    return new Paragraph({
      children: [new TextRun({ text: formatText(text), bold: true, color: "003366", size: size, font: "Calibri" })],
      heading: level,
      spacing: { before: 400, after: 250 },
    });
  };

  const createLabelValue = (label: string, value: string | number | undefined) => new Paragraph({
    children: [
      new TextRun({ text: formatText(label) + " : ", bold: true, size: 22, font: "Calibri" }), // 11pt
      new TextRun({ text: formatText(value?.toString() || "Non renseigné"), size: 22, font: "Calibri" }), // 11pt
    ],
    spacing: { after: 150 },
  });

  const createTableHeaderCell = (text: string, color: string = "0066CC") => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: formatText(text), bold: true, color: "FFFFFF", font: "Calibri", size: 22 })], alignment: AlignmentType.CENTER })],
    shading: { fill: color, type: ShadingType.CLEAR, color: "auto" },
  });

  const createTableCell = (text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) => new TableCell({
    children: [new Paragraph({ text: formatText(text), alignment: align, style: "Normal" })],
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22, // 11pt
          },
          paragraph: {
            spacing: { line: 276 }, // 1.15 lines * 240
            alignment: AlignmentType.JUSTIFIED,
          },
        },
        heading1: {
          run: { font: "Calibri", size: 32, bold: true, color: "003366" },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        heading2: {
          run: { font: "Calibri", size: 28, bold: true, color: "0066CC" },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        heading3: {
          run: { font: "Calibri", size: 24, bold: true },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1417, // 2.5cm
            right: 1417,
            bottom: 1417,
            left: 1417,
          },
        },
      },
      children: [
        // --- PAGE DE GARDE ---
        new Paragraph({ children: [new TextRun({ text: "PROJET DE CRÉATION D'ENTREPRISE", bold: true, size: 32, color: "003366" })], alignment: AlignmentType.CENTER, spacing: { before: 1000, after: 1000 } }),
        new Paragraph({ children: [new TextRun({ text: "BUSINESS PLAN", bold: true, size: 72, color: "0066CC" })], alignment: AlignmentType.CENTER, spacing: { after: 800 } }),

        new Paragraph({ children: [new TextRun({ text: (data.projectTitle || "SANS TITRE").toUpperCase(), bold: true, size: 48 })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 800 } }),

        new Paragraph({ children: [new TextRun({ text: "PRÉSENTÉ PAR :", size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: data.promoterName.toUpperCase(), bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 1500 } }),

        new Paragraph({ children: [new TextRun({ text: `Date de génération : ${new Date().toLocaleDateString("fr-FR")}`, size: 20, color: "888888" })], alignment: AlignmentType.CENTER }),

        new Paragraph({ children: [new PageBreak()] }),

        createHeading("1. INFORMATIONS GÉNÉRALES", HeadingLevel.HEADING_1),
        createLabelValue("Nom Prénom", data.promoterName),
        createLabelValue("CIN", data.promoterCin),
        createLabelValue("Adresse", data.promoterAddress),
        createLabelValue("Téléphone", data.promoterPhone),
        createLabelValue("Instruction", data.promoterEducationLevel),

        new Paragraph({ children: [new PageBreak()] }),
        createHeading("2 & 3. QUALIFICATIONS ET EXPÉRIENCES", HeadingLevel.HEADING_1),
        ...(data.scientificDiplomas && data.scientificDiplomas.length > 0 ? [
          new Paragraph({ children: [new TextRun({ text: "Diplômes Scientifiques / Professionnels :", bold: true })], spacing: { before: 200, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createTableHeaderCell("Diplôme"), createTableHeaderCell("Établissement"), createTableHeaderCell("Année")] }),
              ...data.scientificDiplomas.map(d => new TableRow({
                children: [createTableCell(d.diplomaName), createTableCell(d.institution), createTableCell(d.yearObtained)]
              }))
            ]
          })
        ] : []),
        ...(data.experienceItems && data.experienceItems.length > 0 ? [
          new Paragraph({ children: [new TextRun({ text: "Expériences Professionnelles :", bold: true })], spacing: { before: 200, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createTableHeaderCell("Poste"), createTableHeaderCell("Organisme"), createTableHeaderCell("Durée")] }),
              ...data.experienceItems.map(e => new TableRow({
                children: [createTableCell(e.position), createTableCell(e.institution), createTableCell(e.duration)]
              }))
            ]
          })
        ] : []),

        new Paragraph({ children: [new PageBreak()] }),
        createHeading("4. PRÉSENTATION DU PROJET", HeadingLevel.HEADING_1),
        createLabelValue("Titre", data.projectTitle),
        createLabelValue("Emplacement", data.projectLocation),
        new Paragraph({ children: [new TextRun({ text: data.projectDescription || "Pas de description" })], spacing: { before: 200, after: 200 } }),
        createLabelValue("Avantages du projet", data.projectAdvantages),

        new Paragraph({ children: [new PageBreak()] }),
        createHeading("5. CENTRALE DES RISQUES ET GARANTIES", HeadingLevel.HEADING_1),
        createLabelValue("Crédit BTS en cours", data.hasBtsCredit ? "OUI" : "NON"),
        ...(data.hasBtsCredit ? [new Paragraph({ text: data.btsCreditDetails })] : []),
        createLabelValue("Crédit Système Bancaire", data.hasBankCredit ? "OUI" : "NON"),
        ...(data.hasBankCredit ? [new Paragraph({ text: data.bankCreditDetails })] : []),
        createLabelValue("Garanties réelles", data.hasGuarantees ? "OUI" : "NON"),
        ...(data.hasGuarantees ? [new Paragraph({ text: data.guaranteesDetails })] : []),

        new Paragraph({ children: [new PageBreak()] }),
        createHeading("6. PLAN D'INVESTISSEMENT (en TND)", HeadingLevel.HEADING_1),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createTableHeaderCell("Désignation"), createTableHeaderCell("Prix HT"), createTableHeaderCell("TTC")] }),
            ...(data.equipments || []).map(e => new TableRow({
              children: [createTableCell(e.name), createTableCell(formatAmount(e.priceUnitHT), AlignmentType.RIGHT), createTableCell(formatAmount(e.priceUnitHT * e.quantity * (1 + e.tvaRate / 100)), AlignmentType.RIGHT)]
            }))
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),
        createHeading("7. ÉTUDE DE MARCHÉ ET STRATÉGIE", HeadingLevel.HEADING_1),
        new Paragraph({ children: [new TextRun({ text: "Description des produits/services :", bold: true })], spacing: { before: 200 } }),
        new Paragraph({ text: data.productsDescription }),
        new Paragraph({ children: [new TextRun({ text: "Clientèle cible :", bold: true })], spacing: { before: 200 } }),
        new Paragraph({ text: data.targetAudience }),
        new Paragraph({ children: [new TextRun({ text: "Stratégie Commerciale :", bold: true })], spacing: { before: 200 } }),
        new Paragraph({ text: data.marketingStrategy }),

        new Paragraph({ children: [new PageBreak()] }),
        createHeading("8. ÉTUDE DE RENTABILITÉ DÉTAILLÉE", HeadingLevel.HEADING_1),

        // 8.1 Chiffre d'Affaires
        new Paragraph({ children: [new TextRun({ text: "8.1 Chiffre d'Affaires Prévisionnel (en TND) :", bold: true })], spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createTableHeaderCell("Année"), ...results.years.map((y, i) => createTableHeaderCell(`An ${i + 1}`, "003366"))] }),
            new TableRow({ children: [createTableCell("Chiffre d'Affaires"), ...results.years.map(y => createTableCell(formatAmount(y.turnover), AlignmentType.RIGHT))] })
          ]
        }),

        ...(data.rawMaterials && data.rawMaterials.length > 0 ? [
          new Paragraph({ children: [new TextRun({ text: "8.2 Achats de Matières Premières & Consommations (en TND) :", bold: true })], spacing: { before: 200, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createTableHeaderCell("Désignation"), ...results.years.map((y, i) => createTableHeaderCell(`An ${i + 1}`, "003366"))] }),
              ...data.rawMaterials.map(m => new TableRow({
                children: [
                  createTableCell(m.name),
                  ...results.years.map((y, i) => {
                    const growth = Math.pow(1 + (data.expensesGrowthRate || 0) / 100, i);
                    return createTableCell(formatAmount(m.costUnit * m.quantityAnnual * growth), AlignmentType.RIGHT);
                  })
                ]
              }))
            ]
          })
        ] : []),

        ...(data.personnel && data.personnel.length > 0 ? [
          new Paragraph({ children: [new TextRun({ text: "8.3 Charges de Personnel & Cotisations (en TND) :", bold: true })], spacing: { before: 200, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createTableHeaderCell("Poste"), ...results.years.map((y, i) => createTableHeaderCell(`An ${i + 1}`, "003366"))] }),
              ...data.personnel.map(p => new TableRow({
                children: [
                  createTableCell(p.position),
                  ...results.years.map((y, i) => {
                    const currentYear = i + 1;
                    const startYear = p.startYear || 1;
                    if (currentYear < startYear) return createTableCell("-", AlignmentType.CENTER);

                    const yd = p.yearlyData?.find(d => d.year === currentYear);
                    const count = yd?.count ?? p.count;
                    const salary = yd?.salaryBrut ?? p.salaryBrut;
                    const growth = Math.pow(1 + (data.expensesGrowthRate || 0) / 100, i);
                    const base = salary * count * (p.monthsWorked || 12);
                    const total = base * growth * (1 + (data.socialChargesRate + data.tfpRate + data.foprolosRate) / 100);
                    return createTableCell(formatAmount(total), AlignmentType.RIGHT);
                  })
                ]
              }))
            ]
          })
        ] : []),

        // 8.4 Charges Extérieures
        new Paragraph({ children: [new TextRun({ text: "8.4 Charges Extérieures (Projections sur 7 ans) (en TND) :", bold: true })], spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createTableHeaderCell("Charge"), ...results.years.map((y, i) => createTableHeaderCell(`An ${i + 1}`, "003366"))] }),
            ...Object.keys(data.externalCharges || {}).map(key => {
              const extLabels: Record<string, string> = { rent: "Loyer", utilities: "Énergie", maintenance: "Entretien", insurance: "Assurance", fuel: "Carburant", telecom: "Télécom", advertising: "Publicité", bankFees: "Frais Bancaires", other: "Divers" };
              const baseVal = (data.externalCharges as unknown as Record<string, number>)[key] || 0;
              return new TableRow({
                children: [
                  createTableCell(extLabels[key] || key),
                  ...results.years.map((y, i) => createTableCell(formatAmount(baseVal * Math.pow(1 + (data.expensesGrowthRate || 0) / 100, i)), AlignmentType.RIGHT))
                ]
              });
            }),
            new TableRow({
              children: [createTableCell("TOTAL CHARGES EXT.", AlignmentType.RIGHT), ...results.years.map(y => createTableCell(formatAmount(y.externalChargesTotal), AlignmentType.RIGHT))]
            })
          ]
        }),

        // 8.5 Fiscalité
        new Paragraph({ children: [new TextRun({ text: "8.5 Fiscalité & Taxes (en TND) :", bold: true })], spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createTableHeaderCell("Désignation"), ...results.years.map((y, i) => createTableHeaderCell(`An ${i + 1}`, "003366"))] }),
            new TableRow({ children: [createTableCell("TCL"), ...results.years.map(y => createTableCell(formatAmount(y.tcl), AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("Impôt sur Sociétés"), ...results.years.map(y => createTableCell(formatAmount(y.corporateTax), AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("TOTAL FISCALITÉ"), ...results.years.map(y => createTableCell(formatAmount(y.totalTaxes), AlignmentType.RIGHT))] }),
          ]
        }),

        // 8.6 Amortissements
        ...(results.detailedAmortization && results.detailedAmortization.length > 0 ? [
          new Paragraph({ children: [new TextRun({ text: "8.6 Tableau d'Amortissements Détaillé (en TND) :", bold: true })], spacing: { before: 200, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createTableHeaderCell("Investissement"), createTableHeaderCell("Valeur"), ...results.years.map((y, i) => createTableHeaderCell(`An ${i + 1}`, "003366"))] }),
              ...results.detailedAmortization.map(item => new TableRow({
                children: [createTableCell(item.name), createTableCell(formatAmount(item.ht), AlignmentType.RIGHT), ...item.yearlyValues.map((v: number) => createTableCell(formatAmount(v), AlignmentType.RIGHT))]
              }))
            ]
          })
        ] : []),

        // 8.7 Charges Financières
        ...(results.loanRepayment && results.loanRepayment.length > 0 ? [
          new Paragraph({ children: [new TextRun({ text: "8.7 Tableau des Charges Financières (Crédit) (en TND) :", bold: true })], spacing: { before: 200, after: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createTableHeaderCell("Année"), createTableHeaderCell("Principal"), createTableHeaderCell("Intérêts"), createTableHeaderCell("Mensualité"), createTableHeaderCell("Restant Dû")] }),
              ...results.loanRepayment.map(l => new TableRow({
                children: [createTableCell(`An ${l.year}`), createTableCell(formatAmount(l.principal), AlignmentType.RIGHT), createTableCell(formatAmount(l.interest), AlignmentType.RIGHT), createTableCell(formatAmount(l.total), AlignmentType.RIGHT), createTableCell(formatAmount(l.remainingBalance), AlignmentType.RIGHT)]
              }))
            ]
          })
        ] : []),


        new Paragraph({ children: [new TextRun({ text: `8.8 Tableau d'Exploitation Prévisionnel (en TND) :`, bold: true })], spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createTableHeaderCell("Désignation"), ...results.years.map((y, i) => createTableHeaderCell(`An ${i + 1}`, "003366"))] }),
            new TableRow({ children: [createTableCell("Chiffre Affaires"), ...results.years.map(y => createTableCell(formatAmount(y.turnover), AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("Achats Matières"), ...results.years.map(y => createTableCell(`(${formatAmount(y.materialsCost)})`, AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("Charges Personnel"), ...results.years.map(y => createTableCell(`(${formatAmount(y.personnelCost)})`, AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("Services Extérieurs"), ...results.years.map(y => createTableCell(`(${formatAmount(y.externalChargesTotal)})`, AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("Amortissements"), ...results.years.map(y => createTableCell(`(${formatAmount(y.amortization)})`, AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("Charges Financières"), ...results.years.map(y => createTableCell(`(${formatAmount(y.financialCharges)})`, AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("TOTAL DES CHARGES", AlignmentType.LEFT), ...results.years.map(y => createTableCell(`(${formatAmount(y.totalExpenses)})`, AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("RÉSULTAT AVANT IMPÔT"), ...results.years.map(y => createTableCell(formatAmount(y.preTaxIncome), AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("Fiscalité"), ...results.years.map(y => createTableCell(`(${formatAmount(y.totalTaxes)})`, AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("RÉSULTAT NET"), ...results.years.map(y => createTableCell(formatAmount(y.netResult), AlignmentType.RIGHT))] }),
            new TableRow({ children: [createTableCell("CAF"), ...results.years.map(y => createTableCell(formatAmount(y.cashFlow), AlignmentType.RIGHT))] }),
          ]
        }),

        new Paragraph({ children: [new TextRun({ text: `8.9 Tableau d'Exploitation de l'Année de Croisière (${results.summary.cruiseYear}) (en TND) :`, bold: true })], spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createTableCell("CHIFFRE D'AFFAIRES"), createTableCell(formatAmount(cruise.turnover), AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Achats Matières Premières"), createTableCell(`(${formatAmount(cruise.materialsCost)})`, AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Charges de Personnel"), createTableCell(`(${formatAmount(cruise.personnelCost)})`, AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Services Extérieurs"), createTableCell(`(${formatAmount(cruise.servicesExterieursTotal)})`, AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Autres Services Extérieurs"), createTableCell(`(${formatAmount(cruise.autresServicesExterieursTotal)})`, AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Amortissements"), createTableCell(`(${formatAmount(cruise.amortization)})`, AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Charges Financières"), createTableCell(`(${formatAmount(cruise.financialCharges)})`, AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("RÉSULTAT AVANT IMPÔT"), createTableCell(formatAmount(cruise.preTaxIncome), AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Fiscalité & Impôts"), createTableCell(`(${formatAmount(cruise.totalTaxes)})`, AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("RÉSULTAT NET (Bénéfice)"), createTableCell(formatAmount(cruise.netResult), AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Capacité d'Autofinancement (CAF)"), createTableCell(formatAmount(cruise.cashFlow), AlignmentType.RIGHT)] }),
          ]
        }),

        new Paragraph({ children: [new TextRun({ text: `Note: Les projections sont basées sur un taux de croissance des ventes de ${data.turnoverGrowthRate}% et des charges de ${data.expensesGrowthRate}%.`, italics: true, size: 18 })], spacing: { before: 100, after: 100 } }),

        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ text: "8.10 ANALYSE DE PERFORMANCE ET RENTABILITÉ GLOBALE", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: "Analyse des Coûts (Année Croisière) :", bold: true })], spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createTableCell("Frais Fixes"), createTableCell(formatAmount(results.summary.fixedCostsCruise), AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Frais Variables"), createTableCell(formatAmount(results.summary.variableCostsCruise), AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Marge sur Coût Variable"), createTableCell(formatAmount(results.summary.contributionMarginCruise), AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Point Mort (Chiffre d'Affaires Critique)"), createTableCell(formatAmount(results.summary.breakEvenPoint), AlignmentType.RIGHT)] }),
          ]
        }),

        new Paragraph({ children: [new TextRun({ text: "Indicateurs de Rentabilité Globale :", bold: true })], spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createTableCell("VAN (Valeur Actuelle Nette)"), createTableCell(formatCurrency(results.summary.van), AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("ROI (Retour sur Investissement)"), createTableCell(results.summary.roi.toFixed(2) + "%", AlignmentType.RIGHT)] }),
            new TableRow({ children: [createTableCell("Délai de Récupération"), createTableCell(results.summary.payback ? `${results.summary.payback.years} Ans et ${results.summary.payback.months} Mois` : "Non récupéré", AlignmentType.RIGHT)] }),
          ]
        }),

        // Charts 8.11
        ...(data.chartImages?.breakEven || data.chartImages?.breakEvenEvolution ? [
          new Paragraph({ children: [new PageBreak()] }),
          createHeading("8.11 GRAPHIQUES - SEUIL DE RENTABILITÉ", HeadingLevel.HEADING_2),
        ] : []),

        ...(data.chartImages?.breakEven ? [
          new Paragraph({
            children: [new ImageRun({
              data: Uint8Array.from(atob(data.chartImages.breakEven.split(',')[1]), c => c.charCodeAt(0)),
              transformation: { width: 500, height: 250 }
            } as unknown as ConstructorParameters<typeof ImageRun>[0])
            ]
          })
        ] : []),
        ...(data.chartImages?.breakEvenEvolution ? [
          new Paragraph({
            children: [new ImageRun({
              data: Uint8Array.from(atob(data.chartImages.breakEvenEvolution.split(',')[1]), c => c.charCodeAt(0)),
              transformation: { width: 500, height: 250 }
            } as unknown as ConstructorParameters<typeof ImageRun>[0])
            ]
          })
        ] : []),

        // Charts 8.12
        ...(data.chartImages?.profitability || data.chartImages?.cashFlow ? [
          new Paragraph({ children: [new PageBreak()] }),
          createHeading("8.12 GRAPHIQUES - RENTABILITÉ ET TRÉSORERIE", HeadingLevel.HEADING_2),
        ] : []),

        ...(data.chartImages?.profitability ? [
          new Paragraph({
            children: [new ImageRun({
              data: Uint8Array.from(atob(data.chartImages.profitability.split(',')[1]), c => c.charCodeAt(0)),
              transformation: { width: 500, height: 250 }
            } as unknown as ConstructorParameters<typeof ImageRun>[0])
            ]
          })
        ] : []),
        ...(data.chartImages?.cashFlow ? [
          new Paragraph({
            children: [new ImageRun({
              data: Uint8Array.from(atob(data.chartImages.cashFlow.split(',')[1]), c => c.charCodeAt(0)),
              transformation: { width: 500, height: 250 }
            } as unknown as ConstructorParameters<typeof ImageRun>[0])
            ]
          })
        ] : []),

        new Paragraph({ children: [new PageBreak()] }),
        createHeading("9. ANALYSE FFOM (SWOT)", HeadingLevel.HEADING_1),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createTableHeaderCell("FORCES", "228B22"), createTableHeaderCell("FAIBLESSES", "B22222")] }),
            new TableRow({ children: [createTableCell(data.strengths || "-"), createTableCell(data.weaknesses || "-")] }),
            new TableRow({ children: [createTableHeaderCell("OPPORTUNITÉS", "228B22"), createTableHeaderCell("MENACES", "B22222")] }),
            new TableRow({ children: [createTableCell(data.opportunities || "-"), createTableCell(data.threats || "-")] }),
          ]
        }),

        new Paragraph({ children: [new PageBreak()] }),
        createHeading("10. CONCLUSION ET RECOMMANDATIONS", HeadingLevel.HEADING_1),
        new Paragraph({ text: data.conclusion || "Non renseigné", spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: "Avis Expert : ", bold: true }), new TextRun({ text: data.editorAdvice || "Non renseigné" })] }),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Dossier_${(data.projectTitle || "BP").replace(/\s+/g, "_")}.docx`);
};

export const exportBusinessPlan = async (data: BusinessPlanData, format: ExportFormat): Promise<void> => {
  if (format === "pdf") exportToPDF(data);
  else await exportToDocx(data);
};
