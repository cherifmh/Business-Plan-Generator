
import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StepIndicator } from "@/components/ui/step-indicator";
import { BusinessPlanData, ExportFormat, DiplomaItem, ExperienceItem, EquipmentItem, PersonnelItem, RawMaterialItem, ProductItem, InvestmentResults, ExternalCharges } from "@/types/businessPlan";
import { ArrowLeft, ArrowRight, Download, ShieldCheck, Loader2, Plus, Trash2 } from "lucide-react";
import { SectionGenerator } from "./SectionGenerator";
import { AISettings } from "./AISettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { calculateInvestment, calculateFinancialPlan, calculateOperatingResults } from "@/utils/financialCalculations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const STEPS = [
  { id: 1, title: "Promoteur" },
  { id: 2, title: "Qualifications" },
  { id: 3, title: "Projet" },
  { id: 4, title: "Crédit" },
  { id: 5, title: "Centrale Risque" },
  { id: 6, title: "Investissement" },
  { id: 7, title: "Marché & Exploitation" },
  { id: 8, title: "Rentabilité & Croisière" },
  { id: 9, title: "Analyse FFOM" },
  { id: 10, title: "Conclusion" },
];

const chargeLabels: Record<string, string> = {
  rent: "Loyer",
  utilities: "Dépenses d'énergie (Élec, Eau, Gaz)",
  maintenance: "Entretien et réparation",
  insurance: "Primes d'assurances",
  fuel: "Carburant & Transport",
  telecom: "Télécom & Internet",
  advertising: "Publicité & Marketing",
  bankFees: "Services Bancaires",
  other: "Autres Charges"
};

const initialData: BusinessPlanData = {
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
  loanDuration: 60,
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
  taxRate: 15,
  tfpRate: 2,
  foprolosRate: 1,
  tclRate: 0.2,
  stampsAndRegistration: 0,
  turnoverGrowthRate: 10,
  expensesGrowthRate: 5,
  discountRate: 12,
  projectionYears: 7,
  cruiseYear: 3,

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
};

interface BusinessPlanFormProps {
  onExport: (data: BusinessPlanData, format: ExportFormat) => void;
  isExporting: boolean;
}

export function BusinessPlanForm({ onExport, isExporting }: BusinessPlanFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<BusinessPlanData>(initialData);
  const [investmentResults, setInvestmentResults] = useState<InvestmentResults | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [userHasEditedCruiseYear, setUserHasEditedCruiseYear] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleExportClick = async (format: ExportFormat) => {
    setIsCapturing(true);
    // Allow render cycle to complete and charts to animate/render
    setTimeout(async () => {
      if (chartContainerRef.current) {
        try {
          const container = chartContainerRef.current;
          // Capture eache chart individually
          const breakEvenNode = container.querySelector('#chart-breakeven') as HTMLElement;
          const evolutionNode = container.querySelector('#chart-evolution') as HTMLElement;
          const profitabilityNode = container.querySelector('#chart-profitability') as HTMLElement;
          const cashFlowNode = container.querySelector('#chart-cashflow') as HTMLElement;

          const images: Record<string, string> = {};

          if (breakEvenNode) {
            const canvas = await html2canvas(breakEvenNode, { scale: 2, useCORS: true });
            images.breakEven = canvas.toDataURL("image/png");
          }
          if (evolutionNode) {
            const canvas = await html2canvas(evolutionNode, { scale: 2, useCORS: true });
            images.breakEvenEvolution = canvas.toDataURL("image/png");
          }
          if (profitabilityNode) {
            const canvas = await html2canvas(profitabilityNode, { scale: 2, useCORS: true });
            images.profitability = canvas.toDataURL("image/png");
          }
          if (cashFlowNode) {
            const canvas = await html2canvas(cashFlowNode, { scale: 2, useCORS: true });
            images.cashFlow = canvas.toDataURL("image/png");
          }

          const dataWithImages = { ...data, chartImages: images };
          onExport(dataWithImages, format);
        } catch (e) {
          console.error("Error capturing charts:", e);
          onExport(data, format); // Fallback without images
        } finally {
          setIsCapturing(false);
        }
      } else {
        console.warn("Chart container ref not found");
        onExport(data, format);
        setIsCapturing(false);
      }
    }, 1000); // 1s delay for recharts animation
  };

  const updateField = <K extends keyof BusinessPlanData>(
    field: K,
    value: BusinessPlanData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (data.equipments) {
      const inv = calculateInvestment(data.equipments);
      setInvestmentResults(inv);
      updateField('investmentTotal', inv.totalTTC + (data.startupCosts || 0) + (data.workingCapital || 0));
    }
  }, [data.equipments, data.startupCosts, data.workingCapital]);

  // Auto-detect Cruise Year
  useEffect(() => {
    if (userHasEditedCruiseYear) return;

    const opResults = calculateOperatingResults(data);
    const firstProfitableYear = opResults.years.findIndex(y => y.netResult > 0) + 1;

    if (firstProfitableYear > 0 && firstProfitableYear !== data.cruiseYear) {
      // Avoid infinite loop if already set
      // We use a functional update or just direct update but be careful with deps
      // To be safe, we only update if it's different
      setData(prev => ({ ...prev, cruiseYear: firstProfitableYear }));
    }
  }, [
    data.turnoverGrowthRate,
    data.expensesGrowthRate,
    data.products,
    data.rawMaterials,
    data.personnel,
    data.externalCharges,
    data.taxRate,
    userHasEditedCruiseYear
    // We intentionally don't include data.cruiseYear to avoid loops, though the check helps
  ]);

  const renderSection = (
    field: keyof BusinessPlanData,
    label: string,
    placeholder: string,
    description?: string,
    context?: string
  ) => (
    <SectionGenerator
      id={field}
      label={label}
      value={data[field] as string}
      onChange={(val) => updateField(field, val)}
      placeholder={placeholder}
      description={description}
      context={context}
      businessPlanData={data}
    />
  );

  // List Helpers
  const addEquipment = () => setData(prev => ({ ...prev, equipments: [...(prev.equipments || []), { name: "", priceUnitHT: 0, quantity: 1, tvaRate: 19, duration: 5 }] }));
  const updateEquipment = (index: number, f: keyof EquipmentItem, v: string | number) => { const n = [...(data.equipments || [])]; n[index] = { ...n[index], [f]: v }; updateField('equipments', n); };
  const removeEquipment = (index: number) => { const n = [...(data.equipments || [])]; n.splice(index, 1); updateField('equipments', n); };

  const addScientificDiploma = () => setData(prev => ({ ...prev, scientificDiplomas: [...prev.scientificDiplomas, { diplomaName: "", institution: "", yearObtained: "" }] }));
  const removeScientificDiploma = (index: number) => setData(prev => ({ ...prev, scientificDiplomas: prev.scientificDiplomas.filter((_, i) => i !== index) }));
  const updateScientificDiploma = (index: number, f: string, v: string) => { const n = [...data.scientificDiplomas]; n[index] = { ...n[index], [f]: v }; updateField('scientificDiplomas', n); };

  const addProfessionalDiploma = () => setData(prev => ({ ...prev, professionalDiplomas: [...prev.professionalDiplomas, { diplomaName: "", institution: "", yearObtained: "" }] }));
  const removeProfessionalDiploma = (index: number) => setData(prev => ({ ...prev, professionalDiplomas: prev.professionalDiplomas.filter((_, i) => i !== index) }));
  const updateProfessionalDiploma = (index: number, f: string, v: string) => { const n = [...data.professionalDiplomas]; n[index] = { ...n[index], [f]: v }; updateField('professionalDiplomas', n); };

  const toggleTraining = (t: string) => { const c = data.trainings || []; updateField('trainings', c.includes(t) ? c.filter(x => x !== t) : [...c, t]); };
  const addOtherTraining = () => setData(prev => ({ ...prev, otherTrainings: [...(prev.otherTrainings || []), ""] })); // Fixed array
  const removeOtherTraining = (index: number) => setData(prev => ({ ...prev, otherTrainings: (prev.otherTrainings || []).filter((_, i) => i !== index) }));
  const updateOtherTraining = (index: number, v: string) => { const n = [...(data.otherTrainings || [])]; n[index] = v; updateField('otherTrainings', n); };

  const addExperienceItem = () => setData(prev => ({ ...prev, experienceItems: [...prev.experienceItems, { position: "", institution: "", duration: "" }] }));
  const removeExperienceItem = (index: number) => setData(prev => ({ ...prev, experienceItems: prev.experienceItems.filter((_, i) => i !== index) }));
  const updateExperienceItem = (index: number, f: string, v: string) => { const n = [...data.experienceItems]; n[index] = { ...n[index], [f]: v }; updateField('experienceItems', n); };

  // Section 8 helpers
  const addRawMaterial = () => setData(prev => ({ ...prev, rawMaterials: [...(prev.rawMaterials || []), { name: "", costUnit: 0, quantityAnnual: 0 }] }));
  const updateRawMaterial = (index: number, f: keyof RawMaterialItem, v: string | number) => { const n = [...(data.rawMaterials || [])]; n[index] = { ...n[index], [f]: v }; updateField('rawMaterials', n); };
  const removeRawMaterial = (index: number) => { const n = [...(data.rawMaterials || [])]; n.splice(index, 1); updateField('rawMaterials', n); };

  const addPersonnel = () => setData(prev => ({ ...prev, personnel: [...(prev.personnel || []), { position: "", salaryBrut: 0, count: 1, monthsWorked: 12, startYear: 1 }] }));
  const updatePersonnel = (index: number, f: keyof PersonnelItem, v: string | number) => { const n = [...(data.personnel || [])]; n[index] = { ...n[index], [f]: v }; updateField('personnel', n); };
  const removePersonnel = (index: number) => { const n = [...(data.personnel || [])]; n.splice(index, 1); updateField('personnel', n); };

  const addProduct = () => setData(prev => ({ ...prev, products: [...(prev.products || []), { name: "", priceUnit: 0, quantityAnnual: 0 }] }));
  const updateProduct = (index: number, f: keyof ProductItem, v: string | number) => { const n = [...(data.products || [])]; n[index] = { ...n[index], [f]: v }; updateField('products', n); };
  const removeProduct = (index: number) => { const n = [...(data.products || [])]; n.splice(index, 1); updateField('products', n); };

  const nextStep = () => {
    if (currentStep === 6) {
      const financialPlan = calculateFinancialPlan(data);
      if (Math.abs(financialPlan.gap) >= 1) {
        alert("⚠️ Votre plan de financement n'est pas équilibré. Veuillez ajuster les ressources pour couvrir exactement les besoins (Écart = 0).");
        return;
      }
    }
    if (currentStep < STEPS.length) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const renderStep = () => {
    const formatCurrency = (n: number) => new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(n);
    switch (currentStep) {
      case 1: // Promoter
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2">Informations Personnelles</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="promoterName">Nom Prénom / Raison Sociale</Label>
                <Input id="promoterName" value={data.promoterName} onChange={(e) => updateField("promoterName", e.target.value)} />
              </div>
              <div className="space-y-2 grid grid-cols-2 gap-2">
                <div><Label>Date de naissance</Label><Input type="date" value={data.promoterBirthDate} onChange={(e) => updateField("promoterBirthDate", e.target.value)} /></div>
                <div><Label>Lieu de naissance</Label><Input value={data.promoterBirthPlace} onChange={(e) => updateField("promoterBirthPlace", e.target.value)} /></div>
              </div>
              <div className="space-y-2 grid grid-cols-2 gap-2">
                <div><Label>N° CIN</Label><Input value={data.promoterCin} onChange={(e) => updateField("promoterCin", e.target.value)} /></div>
                <div><Label>Date de livraison</Label><Input type="date" value={data.promoterCinDate} onChange={(e) => updateField("promoterCinDate", e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Adresse Personnelle</Label><Input value={data.promoterAddress} onChange={(e) => updateField("promoterAddress", e.target.value)} /></div>
              <div className="space-y-2"><Label>Téléphone</Label><Input value={data.promoterPhone} onChange={(e) => updateField("promoterPhone", e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={data.promoterEmail || ""} onChange={(e) => updateField("promoterEmail", e.target.value)} /></div>
            </div>

            <h3 className="font-semibold text-lg border-b pb-2 pt-4">Situation & Instruction</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Niveau d'instruction</Label>
                <Select value={data.promoterEducationLevel} onValueChange={(v) => updateField("promoterEducationLevel", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="universitaire">Universitaire</SelectItem>
                    <SelectItem value="formation_professionnelle">Formation Professionnelle</SelectItem>
                    <SelectItem value="secondaire">Secondaire</SelectItem>
                    <SelectItem value="primaire">Primaire</SelectItem>
                    <SelectItem value="autres">Autres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 grid grid-cols-2 gap-2">
                <div><Label>Diplôme</Label><Input value={data.promoterDiploma} onChange={(e) => updateField("promoterDiploma", e.target.value)} /></div>
                <div><Label>Année</Label><Input value={data.promoterDiplomaYear} onChange={(e) => updateField("promoterDiplomaYear", e.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label>Situation Familiale</Label>
                <Select value={data.promoterMaritalStatus} onValueChange={(v) => updateField("promoterMaritalStatus", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="celibataire">Célibataire</SelectItem><SelectItem value="marie">Marié(e)</SelectItem><SelectItem value="veuf">Veuf(ve)</SelectItem><SelectItem value="divorce">Divorcé(e)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service Militaire</Label>
                <Select value={data.promoterMilitaryService} onValueChange={(v) => updateField("promoterMilitaryService", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="accompli">Accompli</SelectItem><SelectItem value="non_accompli">Non Accompli</SelectItem><SelectItem value="non_obligatoire">Non Obligatoire</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <h3 className="font-semibold text-lg border-b pb-2 pt-4">Informations Financières</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Logement</Label>
                <Select value={data.promoterHousingStatus} onValueChange={(v) => updateField("promoterHousingStatus", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="propriete">Propriété</SelectItem><SelectItem value="location">Location</SelectItem><SelectItem value="famille">Famille</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2: // Qualifications
        return (
          <div className="space-y-6">
            <div className="space-y-4 border p-4 rounded-md">
              <div className="flex items-center space-x-2">
                <Switch checked={data.hasScientificQualifications} onCheckedChange={(c) => updateField("hasScientificQualifications", c)} />
                <Label className="font-semibold text-base">Qualifications Scientifiques</Label>
              </div>
              {data.hasScientificQualifications && (
                <div className="space-y-3">
                  {data.scientificDiplomas.map((diploma, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <div><Label className="text-xs">Diplôme</Label><Input value={diploma.diplomaName} onChange={(e) => updateScientificDiploma(index, 'diplomaName', e.target.value)} /></div>
                        <div><Label className="text-xs">Organisme</Label><Input value={diploma.institution} onChange={(e) => updateScientificDiploma(index, 'institution', e.target.value)} /></div>
                        <div><Label className="text-xs">Année</Label><Input value={diploma.yearObtained} onChange={(e) => updateScientificDiploma(index, 'yearObtained', e.target.value)} /></div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeScientificDiploma(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addScientificDiploma}><Plus className="h-4 w-4 mr-2" /> Ajouter</Button>
                </div>
              )}
            </div>

            <div className="space-y-4 border p-4 rounded-md">
              <div className="flex items-center space-x-2">
                <Switch checked={data.hasProfessionalQualifications} onCheckedChange={(c) => updateField("hasProfessionalQualifications", c)} />
                <Label className="font-semibold text-base">Qualifications Professionnelles</Label>
              </div>
              {data.hasProfessionalQualifications && (
                <div className="space-y-3">
                  {data.professionalDiplomas.map((diploma, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <div><Label className="text-xs">Diplôme</Label><Input value={diploma.diplomaName} onChange={(e) => updateProfessionalDiploma(index, 'diplomaName', e.target.value)} /></div>
                        <div><Label className="text-xs">Organisme</Label><Input value={diploma.institution} onChange={(e) => updateProfessionalDiploma(index, 'institution', e.target.value)} /></div>
                        <div><Label className="text-xs">Année</Label><Input value={diploma.yearObtained} onChange={(e) => updateProfessionalDiploma(index, 'yearObtained', e.target.value)} /></div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeProfessionalDiploma(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addProfessionalDiploma}><Plus className="h-4 w-4 mr-2" /> Ajouter</Button>
                </div>
              )}
            </div>

            <div className="space-y-4 border p-4 rounded-md">
              <Label className="font-semibold text-base">Formations Complémentaires</Label>
              <div className="flex flex-wrap gap-4">
                {["CEFE", "CREE", "GERME", "MORAINE"].map((t) => (
                  <div key={t} className="flex items-center space-x-2"><Checkbox checked={data.trainings?.includes(t)} onCheckedChange={() => toggleTraining(t)} /><Label>{t}</Label></div>
                ))}
                <div className="w-full pt-2">
                  <Label className="text-sm font-medium mb-2 block">Autres :</Label>
                  <div className="space-y-2">
                    {(data.otherTrainings || []).map((other, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input value={other} onChange={(e) => updateOtherTraining(index, e.target.value)} className="max-w-md" />
                        <Button variant="ghost" size="icon" onClick={() => removeOtherTraining(index)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addOtherTraining}><Plus className="h-4 w-4 mr-2" /> Ajouter Autre</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border p-4 rounded-md">
              <div className="flex items-center space-x-2">
                <Switch checked={data.hasExperience} onCheckedChange={(c) => updateField("hasExperience", c)} />
                <Label className="font-semibold text-base">Expérience Professionnelle {data.hasExperience ? "" : "(Non)"}</Label>
              </div>
              {data.hasExperience && (
                <div className="space-y-4">
                  <div className="w-1/3"><Label>Années d'expérience</Label><Input type="number" value={data.experienceYears} onChange={(e) => updateField('experienceYears', Number(e.target.value))} /></div>
                  <div className="space-y-3">
                    {data.experienceItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-end p-2 bg-secondary/10 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                          <div><Label className="text-xs">Poste</Label><Input value={item.position} onChange={(e) => updateExperienceItem(index, 'position', e.target.value)} /></div>
                          <div><Label className="text-xs">Organisme</Label><Input value={item.institution} onChange={(e) => updateExperienceItem(index, 'institution', e.target.value)} /></div>
                          <div className="flex gap-2">
                            <div className="flex-1"><Label className="text-xs">Durée</Label><Input value={item.duration} onChange={(e) => updateExperienceItem(index, 'duration', e.target.value)} /></div>
                            <div className="flex-1"><Label className="text-xs">Année</Label><Input value={item.startDate} onChange={(e) => updateExperienceItem(index, 'startDate', e.target.value)} /></div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeExperienceItem(index)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addExperienceItem}><Plus className="h-4 w-4 mr-2" /> Ajouter Expérience</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3: // Projet
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2">Activité & Projet</h3>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Titre du Projet</Label><Input value={data.projectTitle} onChange={(e) => updateField("projectTitle", e.target.value)} /></div>
              {renderSection("projectDescription", "Description de l'Activité", "En quoi consiste votre projet ?")}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Nature</Label><Select value={data.projectNature} onValueChange={(v) => updateField("projectNature", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="creation">Création</SelectItem><SelectItem value="extension">Extension</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Forme Juridique</Label><Select value={data.legalStructure} onValueChange={(v) => updateField("legalStructure", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PP">PP</SelectItem><SelectItem value="SUARL">SUARL</SelectItem><SelectItem value="SARL">SARL</SelectItem><SelectItem value="SA">SA</SelectItem><SelectItem value="Auto entrepreneur">Auto entrepreneur</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Lieu</Label><Input value={data.projectLocation} onChange={(e) => updateField("projectLocation", e.target.value)} /></div>
              <div className="space-y-2"><Label>Superficie (m²)</Label><Input type="number" value={data.projectAreaSize} onChange={(e) => updateField("projectAreaSize", Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Coût Investissement Global</Label><Input type="number" value={data.investmentCost} onChange={(e) => updateField("investmentCost", Number(e.target.value))} /></div>
            </div>
            <div className="space-y-4 p-4 border rounded-md">
              <div className="flex items-center space-x-2 mb-2"><Switch checked={data.hasProjectAdvantages} onCheckedChange={(c) => updateField("hasProjectAdvantages", c)} /><Label>Avantages Code Investissement {data.hasProjectAdvantages ? "(Oui)" : "(Non)"}</Label></div>
              {data.hasProjectAdvantages && (<div className="space-y-2"><Label>Si Oui, lesquels :</Label><Textarea value={data.projectAdvantages || ""} onChange={(e) => updateField("projectAdvantages", e.target.value)} /></div>)}
            </div>
            <div className="space-y-4 p-4 border rounded-md">
              <div className="flex items-center space-x-2 mb-2"><Switch checked={data.hasProjectAuthorizations} onCheckedChange={(c) => updateField("hasProjectAuthorizations", c)} /><Label>Autorisations / Cahier des charges {data.hasProjectAuthorizations ? "(Oui)" : "(Non)"}</Label></div>
              {data.hasProjectAuthorizations && (<div className="space-y-2"><Label>Si Oui, nature :</Label><Textarea value={data.projectAuthorizations || ""} onChange={(e) => updateField("projectAuthorizations", e.target.value)} /></div>)}
            </div>
            <div className="space-y-4 p-4 border rounded-md">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Mode d'exploitation</Label><Select value={data.projectExploitationMode} onValueChange={(v) => updateField("projectExploitationMode", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="propriete">Propriété</SelectItem><SelectItem value="location">Location</SelectItem></SelectContent></Select></div>
                {data.projectExploitationMode === 'location' && (<div className="space-y-2"><Label>Loyer Mensuel</Label><Input type="number" value={data.projectRentCost} onChange={(e) => updateField("projectRentCost", Number(e.target.value))} /></div>)}
              </div>
            </div>
          </div>
        );

      case 4: // Credit
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2">Détails du Crédit Sollicité</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2"><Label>Montant (TND)</Label><Input type="number" value={data.loanAmount} onChange={(e) => updateField("loanAmount", Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Durée (Mois)</Label><Input type="number" value={data.loanDuration} onChange={(e) => updateField("loanDuration", Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Taux d'intérêt (%)</Label><Input type="number" value={data.loanInterestRate} onChange={(e) => updateField("loanInterestRate", Number(e.target.value))} /></div>
            </div>
            {renderSection("loanPurpose", "Objet du Crédit", "Ex: Achat Matériel...")}
            {renderSection("loanJustification", "Justification de Crédit", "Pourquoi ce montant ?")}
          </div>
        );

      case 5: // Centrale Risque
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2">Centrale des Risques (BCT)</h3>
            <div className="space-y-4 p-4 border rounded-md">
              <div className="flex items-center space-x-2 mb-2"><Switch checked={data.hasBtsCredit} onCheckedChange={(c) => updateField("hasBtsCredit", c)} /><Label>Crédit BTS {data.hasBtsCredit ? "(Oui)" : "(Non)"}</Label></div>
              {data.hasBtsCredit && (<div className="space-y-2"><Label>Si Oui, détails :</Label><Textarea value={data.btsCreditDetails || ""} onChange={(e) => updateField("btsCreditDetails", e.target.value)} /></div>)}
            </div>
            <div className="space-y-4 p-4 border rounded-md">
              <div className="flex items-center space-x-2 mb-2"><Switch checked={data.hasBankCredit} onCheckedChange={(c) => updateField("hasBankCredit", c)} /><Label>Crédit Système Bancaire {data.hasBankCredit ? "(Oui)" : "(Non)"}</Label></div>
              {data.hasBankCredit && (<div className="space-y-2"><Label>Si Oui, détails :</Label><Textarea value={data.bankCreditDetails || ""} onChange={(e) => updateField("bankCreditDetails", e.target.value)} /></div>)}
            </div>
            <div className="space-y-4 p-4 border rounded-md">
              <div className="flex items-center space-x-2 mb-2"><Switch checked={data.hasGuarantees} onCheckedChange={(c) => updateField("hasGuarantees", c)} /><Label>Garanties réelles prévues {data.hasGuarantees ? "(Oui)" : "(Non)"}</Label></div>
              {data.hasGuarantees && (<div className="space-y-2"><Label>Si Oui, détails :</Label><Textarea value={data.guaranteesDetails || ""} onChange={(e) => updateField("guaranteesDetails", e.target.value)} /></div>)}
            </div>
          </div>
        );

      case 6: { // Investissement (New Logic)
        const financialPlan = calculateFinancialPlan(data);
        const investmentResults = calculateInvestment(data.equipments || []);

        return (
          <div className="space-y-8">
            <Card>
              <CardHeader><CardTitle>Détails des Équipements & Investissements</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full overflow-x-auto rounded-lg border">
                  <Table className="w-full min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Désignation</TableHead>
                        <TableHead>Prix HT</TableHead>
                        <TableHead>Qté</TableHead>
                        <TableHead>TVA (%)</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.equipments?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell><Input value={item.name} onChange={(e) => updateEquipment(index, 'name', e.target.value)} placeholder="Machine X" /></TableCell>
                          <TableCell><Input type="number" value={item.priceUnitHT} onChange={(e) => updateEquipment(index, 'priceUnitHT', Number(e.target.value))} /></TableCell>
                          <TableCell><Input type="number" value={item.quantity} onChange={(e) => updateEquipment(index, 'quantity', Number(e.target.value))} className="w-20" /></TableCell>
                          <TableCell><Input type="number" value={item.tvaRate} onChange={(e) => updateEquipment(index, 'tvaRate', Number(e.target.value))} className="w-20" /></TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => removeEquipment(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={addEquipment} size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Ajouter Équipement</Button>
                <div className="flex justify-end gap-4 mt-4 font-bold text-sm bg-muted p-4 rounded">
                  <div>Total HT: {formatCurrency(investmentResults?.totalHT || 0)}</div>
                  <div>Total TVA: {formatCurrency(investmentResults?.totalTVA || 0)}</div>
                  <div>Total TTC: {formatCurrency(investmentResults?.totalTTC || 0)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Plan de Financement</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-primary border-b pb-2">EMPLOIS (Besoins)</h4>
                    <div className="flex justify-between items-center text-sm"><span>Investissements TTC :</span><span className="font-medium">{formatCurrency(investmentResults?.totalTTC || 0)}</span></div>
                    <div className="space-y-2 border p-3 rounded bg-muted/20"><Label>Frais d'établissement</Label><Input type="number" value={data.startupCosts} onChange={(e) => updateField('startupCosts', Number(e.target.value))} /></div>
                    <div className="space-y-2 border p-3 rounded bg-muted/20"><Label>Fonds de Roulement</Label><Input type="number" value={data.workingCapital} onChange={(e) => updateField('workingCapital', Number(e.target.value))} /></div>
                    <div className="flex justify-between items-center font-bold pt-2 border-t text-lg"><span>TOTAL EMPLOIS :</span><span>{formatCurrency(financialPlan.uses)}</span></div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-primary border-b pb-2">RESSOURCES (Financement)</h4>
                    <div className="space-y-2"><Label>Apport Personnel</Label><Input type="number" value={data.personalContribution} onChange={(e) => updateField('personalContribution', Number(e.target.value))} /></div>
                    <div className="space-y-2"><Label>Subventions</Label><Input type="number" value={data.grantAmount} onChange={(e) => updateField('grantAmount', Number(e.target.value))} /></div>
                    <div className="space-y-2"><Label>Dotation</Label><Input type="number" value={data.dotation} onChange={(e) => updateField('dotation', Number(e.target.value))} /></div>
                    <div className="space-y-2"><Label>Crédit Bancaire</Label><Input type="number" value={data.bankLoan} onChange={(e) => updateField('bankLoan', Number(e.target.value))} /></div>
                    <div className="space-y-2"><Label>Autres Financements</Label><Input type="number" value={data.otherFunding} onChange={(e) => updateField('otherFunding', Number(e.target.value))} /></div>
                    <div className="flex justify-between items-center font-bold pt-2 border-t text-lg"><span>TOTAL RESSOURCES :</span><span>{formatCurrency(financialPlan.resources)}</span></div>
                  </div>
                </div>
                <div className={`p-4 rounded-md text-center font-bold text-lg ${Math.abs(financialPlan.gap) < 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {Math.abs(financialPlan.gap) < 1 ? "✅ Plan équilibré." : `⚠️ Écart : ${formatCurrency(financialPlan.gap)}`}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      case 7: // Market & Operations
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2">Étude de Marché & Organisation</h3>
            {renderSection("productsDescription", "Description des produits/services", "Quels sont vos produits ou services ?")}
            {renderSection("manufacturingProcess", "Description du procédé de fabrication", "Comment fabriquez-vous vos produits ?")}
            {renderSection("targetAudience", "Clientèle cible", "Qui sont vos clients ?")}
            {renderSection("marketStudy", "Étude de Marché", "Analyse de la concurrence et du marché...")}
            {renderSection("locationDescription", "Emplacement", "Pourquoi cet emplacement ?")}
            {renderSection("marketingStrategy", "Stratégie Commerciale", "Prix, Distribution, Promotion...")}
            {renderSection("salesBreakdown", "Ventilation des ventes et mode paiement", "Comment vendez-vous et quels sont les délais de paiement ?")}
            {renderSection("purchasingBreakdown", "Ventilation des achats et mode de règlement", "Comment achetez-vous et quels sont vos délais de règlement ?")}
            {renderSection("suppliers", "Fournisseurs d'équipement et de matière première", "Qui sont vos principaux fournisseurs ?")}
          </div>
        );

      case 8: { // Rentabilité
        const results = calculateOperatingResults(data);
        const y1 = results.years[0];

        return (
          <div className="space-y-8 w-full">
            <div className="grid md:grid-cols-3 gap-4 bg-primary/5 p-4 rounded-lg border border-primary/20">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-primary">Taux de Croissance Annuel CA (%)</Label>
                <Input type="number" className="h-8" value={data.turnoverGrowthRate} onChange={(e) => updateField('turnoverGrowthRate', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-primary">Taux d'évolution des Charges (%)</Label>
                <Input type="number" className="h-8" value={data.expensesGrowthRate} onChange={(e) => updateField('expensesGrowthRate', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-primary">Taux d'Actualisation (%)</Label>
                <Input type="number" className="h-8" value={data.discountRate} onChange={(e) => updateField('discountRate', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-primary">Taux d'Intérêt Crédit (%)</Label>
                <Input type="number" className="h-8" value={data.loanInterestRate} onChange={(e) => updateField('loanInterestRate', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-primary">Durée Projection (Ans)</Label>
                <Input type="number" min={3} max={10} className="h-8 border-primary/40 focus:border-primary" value={data.projectionYears} onChange={(e) => updateField('projectionYears', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-primary">Année de Croisière ({userHasEditedCruiseYear ? 'Manuel' : 'Auto'})</Label>
                <Input
                  type="number"
                  min={1}
                  max={data.projectionYears}
                  className={`h-8 border-primary/40 focus:border-primary ${userHasEditedCruiseYear ? 'bg-primary/5' : ''}`}
                  value={data.cruiseYear}
                  onChange={(e) => {
                    updateField('cruiseYear', Number(e.target.value));
                    setUserHasEditedCruiseYear(true);
                  }}
                />
              </div>
            </div>

            {/* 1. Chiffre d'Affaires */}
            <Card>
              <CardHeader><CardTitle>1. Chiffre d'Affaires Prévisionnel ({data.projectionYears} Ans)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full overflow-x-auto rounded-lg border">
                  <Table className="w-full min-w-[1000px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[250px] sticky left-0 bg-background z-10 border-r">Désignation Produit/Service</TableHead>
                        <TableHead className="w-[100px]">Prix Vente</TableHead>
                        <TableHead className="w-[100px]">Qté Ann. Y1</TableHead>
                        {results.years.map((_, i) => (
                          <TableHead key={i} className="text-right whitespace-nowrap px-4 border-r last:border-r-0">An {i + 1}</TableHead>
                        ))}
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.products?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="sticky left-0 bg-background z-10 border-r"><Input className="h-8 text-xs" value={item.name} onChange={(e) => updateProduct(index, 'name', e.target.value)} placeholder="Produit X" /></TableCell>
                          <TableCell><Input className="h-8 text-xs" type="number" value={item.priceUnit} onChange={(e) => updateProduct(index, 'priceUnit', Number(e.target.value))} /></TableCell>
                          <TableCell><Input className="h-8 text-xs" type="number" value={item.quantityAnnual} onChange={(e) => updateProduct(index, 'quantityAnnual', Number(e.target.value))} /></TableCell>
                          {results.years.map((y, i) => {
                            const growth = Math.pow(1 + (data.turnoverGrowthRate || 0) / 100, i);
                            return <TableCell key={i} className="text-right text-xs font-medium border-r last:border-r-0">{formatCurrency(item.priceUnit * item.quantityAnnual * growth)}</TableCell>
                          })}
                          <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeProduct(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={addProduct} size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Ajouter Produit</Button>
                <div className="flex justify-end mt-4 font-bold text-lg bg-primary/10 p-4 rounded text-primary">
                  Total Chiffre d'Affaires (Année 1) : {formatCurrency(y1.turnover)}
                </div>
              </CardContent>
            </Card>

            {/* 8.1 Matières Premières */}
            <Card>
              <CardHeader><CardTitle>2. Achats de Matières Premières & Consommations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full overflow-x-auto rounded-lg border">
                  <Table className="w-full min-w-[1000px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[250px] sticky left-0 bg-background z-10 border-r">Désignation</TableHead>
                        <TableHead className="w-[100px]">Coût Unit.</TableHead>
                        <TableHead className="w-[100px]">Qté Ann. Y1</TableHead>
                        {results.years.map((_, i) => (
                          <TableHead key={i} className="text-right whitespace-nowrap px-4 border-r last:border-r-0">An {i + 1}</TableHead>
                        ))}
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.rawMaterials?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="sticky left-0 bg-background z-10 border-r"><Input className="h-8 text-xs" value={item.name} onChange={(e) => updateRawMaterial(index, 'name', e.target.value)} placeholder="Matière X" /></TableCell>
                          <TableCell><Input className="h-8 text-xs" type="number" value={item.costUnit} onChange={(e) => updateRawMaterial(index, 'costUnit', Number(e.target.value))} /></TableCell>
                          <TableCell><Input className="h-8 text-xs" type="number" value={item.quantityAnnual} onChange={(e) => updateRawMaterial(index, 'quantityAnnual', Number(e.target.value))} /></TableCell>
                          {results.years.map((y, i) => {
                            const growth = Math.pow(1 + (data.expensesGrowthRate || 0) / 100, i);
                            return <TableCell key={i} className="text-right text-xs font-medium border-r last:border-r-0">{formatCurrency(item.costUnit * item.quantityAnnual * growth)}</TableCell>
                          })}
                          <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRawMaterial(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={addRawMaterial} size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Ajouter Matière</Button>
              </CardContent>
            </Card>

            {/* 8.2 Personnel */}
            <Card>
              <CardHeader><CardTitle>3. Charges de Personnel & Cotisations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-4 bg-muted/30 p-3 rounded">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold">CNSS Employeur (%)</Label>
                    <Input type="number" className="h-8" value={data.socialChargesRate} onChange={(e) => updateField('socialChargesRate', Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold">TFP (%)</Label>
                    <Input type="number" className="h-8" value={data.tfpRate} onChange={(e) => updateField('tfpRate', Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold">FOPROLOS (%)</Label>
                    <Input type="number" className="h-8" value={data.foprolosRate} onChange={(e) => updateField('foprolosRate', Number(e.target.value))} />
                  </div>
                </div>
                <div className="w-full overflow-x-auto rounded-lg border">
                  <Table className="w-full min-w-[1200px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="min-w-[200px] sticky left-0 bg-background z-10 border-r">Poste</TableHead>
                        <TableHead className="w-[120px]">Sal. Brut</TableHead>
                        <TableHead className="w-[60px]">Mois</TableHead>
                        <TableHead className="w-[80px]">Début (An)</TableHead>
                        {results.years.map((_, i) => (
                          <TableHead key={i} className="text-center whitespace-nowrap px-2 border-r last:border-r-0">
                            <div className="text-xs font-bold">An {i + 1}</div>
                            <div className="text-[10px] text-muted-foreground font-normal">Nb | Coût</div>
                          </TableHead>
                        ))}
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.personnel?.map((p, index) => {
                        const updateYearlyCount = (year: number, count: number) => {
                          const newPersonnel = [...(data.personnel || [])];
                          const yearlyData = newPersonnel[index].yearlyData || [];
                          const existingIndex = yearlyData.findIndex(yd => yd.year === year);

                          if (existingIndex >= 0) {
                            yearlyData[existingIndex] = { ...yearlyData[existingIndex], count };
                          } else {
                            yearlyData.push({ year, count, salaryBrut: p.salaryBrut });
                          }

                          newPersonnel[index] = { ...newPersonnel[index], yearlyData };
                          updateField('personnel', newPersonnel);
                        };

                        const getYearlyCount = (year: number) => {
                          const yearData = p.yearlyData?.find(yd => yd.year === year);
                          return yearData?.count ?? p.count;
                        };

                        const getYearlySalary = (year: number) => {
                          const yearData = p.yearlyData?.find(yd => yd.year === year);
                          return yearData?.salaryBrut ?? p.salaryBrut;
                        };

                        return (
                          <TableRow key={index}>
                            <TableCell className="sticky left-0 bg-background z-10 border-r">
                              <div className="flex items-center gap-2">
                                <Input
                                  className="h-8 text-xs flex-1"
                                  value={p.position}
                                  onChange={(e) => updatePersonnel(index, 'position', e.target.value)}
                                  placeholder="Poste"
                                />
                                {p.count > 1 && (
                                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">x {p.count}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-8 text-xs"
                                type="number"
                                value={p.salaryBrut}
                                onChange={(e) => updatePersonnel(index, 'salaryBrut', Number(e.target.value))}
                                placeholder="Salaire"
                              />
                            </TableCell>
                            <TableCell><Input className="h-8 text-xs" type="number" value={p.count} onChange={(e) => updatePersonnel(index, 'count', Number(e.target.value))} /></TableCell>
                            <TableCell><Input className="h-8 text-xs" type="number" value={p.monthsWorked} onChange={(e) => updatePersonnel(index, 'monthsWorked', Number(e.target.value))} /></TableCell>
                            <TableCell><Input className="h-8 text-xs" type="number" value={p.startYear || 1} min={1} max={data.projectionYears} onChange={(e) => updatePersonnel(index, 'startYear', Number(e.target.value))} /></TableCell>
                            {results.years.map((y, i) => {
                              const currentYear = i + 1;
                              const startYear = p.startYear || 1;

                              if (currentYear < startYear) {
                                return (
                                  <TableCell key={i} className="text-center text-xs border-r last:border-r-0">
                                    <div className="text-muted-foreground">-</div>
                                  </TableCell>
                                );
                              }

                              const count = getYearlyCount(currentYear);
                              const salary = getYearlySalary(currentYear);
                              const baseBrut = salary * count * p.monthsWorked;
                              const totalWithCharges = baseBrut * (1 + (data.socialChargesRate + data.tfpRate + data.foprolosRate) / 100);

                              return (
                                <TableCell key={i} className="border-r last:border-r-0 p-1">
                                  <div className="flex flex-col gap-1">
                                    <Input
                                      className="h-7 text-xs text-center"
                                      type="number"
                                      min={0}
                                      value={count}
                                      onChange={(e) => updateYearlyCount(currentYear, Number(e.target.value))}
                                    />
                                    <div className="text-[10px] text-center font-medium text-primary">{formatCurrency(totalWithCharges)}</div>
                                  </div>
                                </TableCell>
                              );
                            })}
                            <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removePersonnel(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={addPersonnel} size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Ajouter Personnel</Button>
                <div className="mt-4 p-4 rounded bg-muted grid grid-cols-2 gap-x-8 gap-y-2">
                  <div className="flex justify-between text-sm"><span>Salaires Bruts :</span><span className="font-medium">{formatCurrency(y1.totalGrossSalary)}</span></div>
                  <div className="flex justify-between text-sm text-muted-foreground"><span>CNSS ({data.socialChargesRate}%) :</span><span>{formatCurrency(y1.cnss)}</span></div>
                  <div className="flex justify-between text-sm text-muted-foreground"><span>TFP ({data.tfpRate}%) :</span><span>{formatCurrency(y1.tfp)}</span></div>
                  <div className="flex justify-between text-sm text-muted-foreground"><span>FOPROLOS ({data.foprolosRate}%) :</span><span>{formatCurrency(y1.foprolos)}</span></div>
                  <div className="flex justify-between font-bold border-t mt-2 pt-2 col-span-2"><span>COÛT TOTAL PERSONNEL ANNUEL :</span><span>{formatCurrency(y1.personnelCost)}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* 8.3 & 8.4 & 8.5 Autres Charges & Fiscalité */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader><CardTitle>4. Charges Extérieures (Projections)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[200px] sticky left-0 bg-background z-10 border-r">Services & Autres</TableHead>
                          <TableHead className="w-[100px]">Base Annuelle Y1</TableHead>
                          {results.years.map((_, i) => (
                            <TableHead key={i} className="text-right whitespace-nowrap px-2 border-r last:border-r-0 text-[10px]">An {i + 1}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(Object.keys(chargeLabels) as Array<keyof typeof data.externalCharges>).map((key) => (
                          <TableRow key={key}>
                            <TableCell className="sticky left-0 bg-background z-10 border-r font-medium text-[10px]">{chargeLabels[key]}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-7 text-[10px] w-20"
                                value={data.externalCharges[key]}
                                onChange={(e) => {
                                  const newCharges: ExternalCharges = { ...data.externalCharges, [key]: Number(e.target.value) };
                                  updateField('externalCharges', newCharges);
                                }}
                              />
                            </TableCell>
                            {results.years.map((y, i) => {
                              const growth = Math.pow(1 + (data.expensesGrowthRate || 0) / 100, i);
                              return <TableCell key={i} className="text-right text-[10px] border-r last:border-r-0">{formatCurrency(data.externalCharges[key] * growth)}</TableCell>
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>5. Fiscalité & Taxes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Régime Fiscal</Label>
                      <Select value={data.taxRegime} onValueChange={(v: 'forfaitaire' | 'reel') => updateField('taxRegime', v)}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="forfaitaire">Régime Forfaitaire</SelectItem>
                          <SelectItem value="reel">Régime Réel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span>Amortissements Annuels :</span><span className="font-medium">{formatCurrency(y1.amortization)}</span></div>
                      <p className="text-[10px] text-muted-foreground italic">(Liés à la section Investissement)</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span>Charges Financières :</span><span className="font-medium">{formatCurrency(y1.financialCharges)}</span></div>
                      <p className="text-[10px] text-muted-foreground italic">(Estimées / crédit BTS)</p>
                    </div>
                    <hr />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold">TCL (%)</Label>
                        <Input type="number" className="h-8" value={data.tclRate} onChange={(e) => updateField('tclRate', Number(e.target.value))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold">Timbres & Enreg.</Label>
                        <Input type="number" className="h-8" value={data.stampsAndRegistration} onChange={(e) => updateField('stampsAndRegistration', Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Taxes Fixes (Taxes circulation, etc.)</Label>
                      <Input type="number" value={data.fixedTaxes} onChange={(e) => updateField('fixedTaxes', Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Taux d'Impôt / Résultat (%)</Label>
                      <Input type="number" value={data.taxRate} onChange={(e) => updateField('taxRate', Number(e.target.value))} />
                    </div>
                    <div className="mt-2 p-3 bg-primary/5 rounded border border-primary/10">
                      <div className="flex justify-between text-xs font-semibold"><span>Total Fiscalité :</span><span>{formatCurrency(y1.totalTaxes - y1.corporateTax)}</span></div>
                      <p className="text-[9px] text-muted-foreground italic">(Hous impôt sur les sociétés)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle>6. Tableau d'Amortissements Détaillé</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                  <Table className="min-w-[1000px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[200px] sticky left-0 bg-background z-10 border-r">Équipement</TableHead>
                        <TableHead className="text-right w-[120px]">Valeur HT</TableHead>
                        <TableHead className="text-center w-[100px]">Durée (Ans)</TableHead>
                        {results.years.map((_, i) => (
                          <TableHead key={i} className="text-right whitespace-nowrap px-4 border-r last:border-r-0">Amort. An {i + 1}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.detailedAmortization.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-xs sticky left-0 bg-background z-10 border-r">{item.name}</TableCell>
                          <TableCell className="text-right text-xs">{formatCurrency(item.ht)}</TableCell>
                          <TableCell className="text-center text-xs">
                            <Input
                              type="number"
                              className="h-7 w-16 mx-auto text-center text-xs"
                              value={item.duration}
                              onChange={(e) => updateEquipment(i, 'duration', Number(e.target.value))}
                            />
                          </TableCell>
                          {item.yearlyValues.map((val, idx) => (
                            <TableCell key={idx} className="text-right text-xs text-primary font-medium border-r last:border-r-0">{formatCurrency(val)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell className="sticky left-0 bg-muted/50 z-10 border-r">TOTAL</TableCell>
                        <TableCell className="text-right text-xs">{formatCurrency(results.detailedAmortization.reduce((sum, i) => sum + i.ht, 0))}</TableCell>
                        <TableCell></TableCell>
                        {results.years.map((y, idx) => (
                          <TableCell key={idx} className="text-right text-xs text-primary border-r last:border-r-0">{formatCurrency(y.amortization)}</TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>


            {/* TABLEAU DES CHARGES FINANCIÈRES */}
            <Card>
              <CardHeader><CardTitle>7. Tableau des Charges Financières (Crédit)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Année</TableHead>
                      <TableHead className="text-right">Amort. Principal</TableHead>
                      <TableHead className="text-right">Intérêts</TableHead>
                      <TableHead className="text-right">Annuité</TableHead>
                      <TableHead className="text-right">Capital Restant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.loanRepayment.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-xs">An {row.year}</TableCell>
                        <TableCell className="text-right text-xs">{formatCurrency(row.principal)}</TableCell>
                        <TableCell className="text-right text-xs text-orange-600 font-bold">{formatCurrency(row.interest)}</TableCell>
                        <TableCell className="text-right text-xs">{formatCurrency(row.total)}</TableCell>
                        <TableCell className="text-right text-xs">{formatCurrency(row.remainingBalance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* TABLEAU D'EXPLOITATION PRÉVISIONNEL */}
            <Card className="border-2 border-primary">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-center text-primary uppercase">TABLEAU D'EXPLOITATION PRÉVISIONNEL ({data.projectionYears} ANS)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="w-full overflow-x-auto rounded-lg border">
                  <Table className="w-full min-w-[1200px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-bold min-w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Désignation (en TND)</TableHead>
                        {results.years.map((_, i) => (
                          <TableHead key={i} className="text-right font-bold whitespace-nowrap px-4 border-r last:border-r-0">Année {i + 1}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="font-bold text-primary bg-primary/5">
                        <TableCell className="sticky left-0 bg-primary/5 z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">CHIFFRE D'AFFAIRES (Ventes)</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right border-r last:border-r-0">{formatCurrency(y.turnover)}</TableCell>)}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Achats Matières Premières</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right border-r last:border-r-0">({formatCurrency(y.materialsCost)})</TableCell>)}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Charges de Personnel (TTC)</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right border-r last:border-r-0">({formatCurrency(y.personnelCost)})</TableCell>)}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Services Extérieurs</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right border-r last:border-r-0">({formatCurrency(y.servicesExterieursTotal)})</TableCell>)}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Autres Services Extérieurs</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right border-r last:border-r-0">({formatCurrency(y.autresServicesExterieursTotal)})</TableCell>)}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Charges Financières</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right border-r last:border-r-0">({formatCurrency(y.financialCharges)})</TableCell>)}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Amortissements</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right border-r last:border-r-0">({formatCurrency(y.amortization)})</TableCell>)}
                      </TableRow>
                      <TableRow className="font-semibold border-t">
                        <TableCell className="sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">RÉSULTAT AVANT IMPÔT</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right border-r last:border-r-0">{formatCurrency(y.preTaxIncome)}</TableCell>)}
                      </TableRow>
                      <TableRow className="text-muted-foreground text-xs italic">
                        <TableCell className="sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Fiscalité & Impôts</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right border-r last:border-r-0">({formatCurrency(y.totalTaxes)})</TableCell>)}
                      </TableRow>
                      <TableRow className="h-4"></TableRow>
                      <TableRow className="bg-primary/10">
                        <TableCell className="text-lg font-bold text-primary sticky left-0 bg-primary/10 z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">RÉSULTAT NET</TableCell>
                        {results.years.map((y, i) => (
                          <TableCell key={i} className={`text-right text-lg font-bold border-r last:border-r-0 ${y.netResult > 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(y.netResult)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="border-t">
                        <TableCell className="italic text-muted-foreground sticky left-0 bg-white z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Capacité d'Autofinancement</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right text-muted-foreground border-r last:border-r-0">{formatCurrency(y.cashFlow)}</TableCell>)}
                      </TableRow>
                      <TableRow className="font-bold bg-green-50">
                        <TableCell className="text-green-800 underline decoration-double sticky left-0 bg-green-50 z-20 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">CASH FLOW ACTUALISÉ ({data.discountRate}%)</TableCell>
                        {results.years.map((y, i) => <TableCell key={i} className="text-right text-green-800 border-r last:border-r-0">{formatCurrency(y.discountedCashFlow)}</TableCell>)}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* TABLEAU D'EXPLOITATION DE L'ANNÉE DE CROISIÈRE */}
            <Card className="border-2 border-green-600 bg-green-50/10">
              <CardHeader className="bg-green-600/10">
                <CardTitle className="text-center text-green-700 uppercase flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  Tableau d'Exploitation de l'Année de Croisière (An {results.summary.cruiseYear})
                </CardTitle>
                <CardDescription className="text-center text-green-600/80 italic">
                  Année de stabilité représentative du fonctionnement normal de l'activité
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="w-full overflow-x-auto rounded-lg border bg-white">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-bold">Désignation (en TND)</TableHead>
                        <TableHead className="text-right font-bold">Année de Croisière ({results.summary.cruiseYear})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="font-bold text-green-700">
                        <TableCell>CHIFFRE D'AFFAIRES (Ventes)</TableCell>
                        <TableCell className="text-right">{formatCurrency(results.summary.cruiseYearData.turnover)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Achats Matières Premières</TableCell>
                        <TableCell className="text-right">({formatCurrency(results.summary.cruiseYearData.materialsCost)})</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Charges de Personnel (TTC)</TableCell>
                        <TableCell className="text-right">({formatCurrency(results.summary.cruiseYearData.personnelCost)})</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Services Extérieurs</TableCell>
                        <TableCell className="text-right">({formatCurrency(results.summary.cruiseYearData.servicesExterieursTotal)})</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Autres Services Extérieurs</TableCell>
                        <TableCell className="text-right">({formatCurrency(results.summary.cruiseYearData.autresServicesExterieursTotal)})</TableCell>
                      </TableRow>
                      {results.summary.cruiseYearData.financialCharges > 0 && (
                        <TableRow>
                          <TableCell>Charges Financières</TableCell>
                          <TableCell className="text-right">({formatCurrency(results.summary.cruiseYearData.financialCharges)})</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell>Amortissements</TableCell>
                        <TableCell className="text-right">({formatCurrency(results.summary.cruiseYearData.amortization)})</TableCell>
                      </TableRow>
                      <TableRow className="font-semibold border-t border-green-200">
                        <TableCell>RÉSULTAT AVANT IMPÔT</TableCell>
                        <TableCell className="text-right">{formatCurrency(results.summary.cruiseYearData.preTaxIncome)}</TableCell>
                      </TableRow>
                      <TableRow className="text-muted-foreground text-xs italic">
                        <TableCell>Fiscalité & Impôts</TableCell>
                        <TableCell className="text-right">({formatCurrency(results.summary.cruiseYearData.totalTaxes)})</TableCell>
                      </TableRow>
                      <TableRow className="bg-green-100">
                        <TableCell className="text-xl font-bold text-green-800 underline decoration-double">RÉSULTAT NET (BÉNÉFICE)</TableCell>
                        <TableCell className={`text-right text-xl font-bold ${results.summary.cruiseYearData.netResult > 0 ? 'text-green-800' : 'text-red-700'}`}>
                          {formatCurrency(results.summary.cruiseYearData.netResult)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="italic text-muted-foreground bg-green-50/50">
                        <TableCell>Capacité d'Autofinancement (CAF)</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(results.summary.cruiseYearData.cashFlow)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            {/* INDICATEURS DE PERFORMANCE GLOBALE */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5 pb-3">
                  <CardTitle className="text-sm">Analyse des Coûts (Année Croisière)</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frais Fixes :</span>
                    <span className="font-semibold">{formatCurrency(results.summary.fixedCostsCruise)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frais Variables :</span>
                    <span className="font-semibold">{formatCurrency(results.summary.variableCostsCruise)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-bold text-primary">Marge sur Coût Variable :</span>
                    <span className="font-bold text-primary">{formatCurrency(results.summary.contributionMarginCruise)}</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 italic text-[11px] text-blue-800">
                    <strong>Point Mort (An {results.summary.cruiseYear}) :</strong> {formatCurrency(results.summary.breakEvenPoint)}
                    <p className="mt-1">Niveau de ventes minimum en période de croisière pour couvrir toutes les charges.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5 pb-3">
                  <CardTitle className="text-sm">Indicateurs de Rentabilité Globale</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">VAN (Valeur Actuelle Nette)</p>
                      <p className={`text-lg font-bold ${results.summary.van > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(results.summary.van)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">ROI (An Croisière)</p>
                      <p className={`text-lg font-bold ${results.summary.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.summary.roi.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs font-bold text-green-800 uppercase">Délai de Récupération du Capital</p>
                    <p className="text-xl font-black text-green-900 mt-1">
                      {results.summary.payback
                        ? `${results.summary.payback.years} Ans et ${results.summary.payback.months} Mois`
                        : (results.summary.totalInvestment > 0 ? "Non récupéré (Déficitaire)" : "0 Ans et 0 Mois")}
                      {results.summary.payback && results.summary.payback.years >= data.projectionYears && (
                        <span className="ml-2 text-[10px] font-normal bg-green-200 text-green-800 px-1.5 py-0.5 rounded uppercase font-sans">Est.</span>
                      )}
                    </p>
                    <p className="text-[10px] text-green-700 italic mt-1">Temps nécessaire pour que les cash-flows remboursent l'investissement initial.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* GRAPHIQUES DU SEUIL DE RENTABILITÉ */}
            <div className="grid md:grid-cols-2 gap-8 mt-10">
              <Card className="p-6 border-blue-100 shadow-md">
                <CardHeader className="p-0 pb-6 border-b mb-6">
                  <CardTitle className="text-lg font-bold text-blue-800 uppercase tracking-wider text-center">Analyse du Seuil de Rentabilité (Point Mort - Croisière)</CardTitle>
                </CardHeader>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.cvpData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="percentage" fontSize={12} unit="%" label={{ value: 'Niveau d\'Activité (%)', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#64748b' }} />
                      <YAxis fontSize={12} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="revenue" name="Chiffre d'Affaires" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                      <Area type="monotone" dataKey="totalCosts" name="Coûts Totaux (Fixes + Var)" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2} />
                      <Line type="monotone" dataKey="fixedCosts" name="Frais Fixes" stroke="#94A3B8" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground italic text-center mt-4">Le point mort est atteint là où la courbe bleue (CA) croise la courbe rouge (Coûts).</p>
              </Card>

              <Card className="p-6 border-orange-100 shadow-md">
                <CardHeader className="p-0 pb-6 border-b mb-6">
                  <CardTitle className="text-lg font-bold text-orange-800 uppercase tracking-wider text-center">Évolution du Point Mort ({data.projectionYears} Ans)</CardTitle>
                </CardHeader>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.breakEvenEvolution} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="year" tickFormatter={(val) => `An ${val}`} fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="turnover" name="Chiffre d'Affaires" stroke="#10B981" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="breakEvenPoint" name="CA Critique (Point Mort)" stroke="#F59E0B" strokeWidth={3} strokeDasharray="8 4" dot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground italic text-center mt-4">Plus l'écart est grand entre le CA (vert) et le CA Critique (orange), plus le projet est sécurisé.</p>
              </Card>
            </div>

            {/* GRAPHIQUES DE RENTABILITÉ */}
            <div className="flex flex-col gap-8 mt-10">
              <Card className="p-6 border-primary/20 shadow-md">
                <CardHeader className="p-0 pb-6 border-b mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-bold text-primary uppercase tracking-wider">Évolution de la Rentabilité (CA vs Résultat Net)</CardTitle>
                    <div className="flex gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div> CA</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div> Résultat Net</div>
                    </div>
                  </div>
                </CardHeader>
                <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.years.map((y, i) => ({ name: `An ${i + 1}`, CA: y.turnover, Net: y.netResult }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} dy={10} fontStyle="bold" />
                      <YAxis fontSize={12} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(value: number) => [formatCurrency(value), ""]}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                      />
                      <Bar dataKey="CA" name="Chiffre d'Affaires" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                      <Bar dataKey="Net" name="Résultat Net" fill="#10B981" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 border-primary/20 shadow-md">
                <CardHeader className="p-0 pb-6 border-b mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-bold text-primary uppercase tracking-wider">Courbe de Récupération & Cash Flow Cumulé</CardTitle>
                    <div className="flex gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-green-500/20 border border-green-500"></div> Flux Cumulés</div>
                      <div className="flex items-center gap-1.5"><div className="w-8 h-0 border-t-2 border-dashed border-red-500"></div> Investissement</div>
                    </div>
                  </div>
                </CardHeader>
                <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.cumulativeCFSeries.map(s => ({ ...s, name: `An ${s.year}`, investment: results.summary.totalInvestment }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorCF" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} dy={10} fontStyle="bold" />
                      <YAxis fontSize={12} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                        formatter={(value: number) => [formatCurrency(value), ""]}
                      />
                      <Line type="monotone" dataKey="investment" name="Investissement Initial" stroke="#EF4444" strokeWidth={3} strokeDasharray="8 8" dot={false} />
                      <Area type="monotone" dataKey="cumulative" name="Cash Flow Cumulé" stroke="#059669" fillOpacity={1} fill="url(#colorCF)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground italic">Note: Les projections sont calculées automatiquement sur {data.projectionYears} ans selon les taux de croissance saisis.</p>
            </div>
          </div >
        );
      }

      case 9: // FFOM
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {renderSection("strengths", "Forces", "Points forts")}
              {renderSection("weaknesses", "Faiblesses", "Points faibles")}
              {renderSection("opportunities", "Opportunités", "Marché")}
              {renderSection("threats", "Menaces", "Concurrence")}
            </div>
          </div>
        );

      case 10: // Conclusion
        return (
          <div className="space-y-6">
            {renderSection("conclusion", "Conclusion Générale", "Synthèse globale du projet...", "Une synthèse professionnelle des points clés du projet.")}
            {renderSection("editorAdvice", "Avis du Rédacteur", "Recommandations et avis technique...", "L'avis critique et les recommandations stratégiques du rédacteur.")}

            <div className="pt-8 flex flex-col items-center justify-center gap-4 border-t mt-8">
              <h3 className="text-xl font-bold">Dossier Complet</h3>
              <div className="flex gap-4">
                <Button onClick={() => handleExportClick('pdf')} disabled={isExporting || isCapturing} className="gap-2">{isExporting || isCapturing ? <Loader2 className="animate-spin" /> : <Download />} Export PDF</Button>
                <Button onClick={() => handleExportClick('docx')} variant="outline" disabled={isExporting || isCapturing} className="gap-2">{isExporting || isCapturing ? <Loader2 className="animate-spin" /> : <Download />} Export DOCX</Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "w-full transition-all duration-300 mx-auto",
      (currentStep === 8 || currentStep === 6) ? "max-w-[95%]" : "max-w-5xl"
    )}>
      <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
      <Card className="shadow-lg mt-6">
        <CardHeader><CardTitle>{STEPS[currentStep - 1].title}</CardTitle><CardDescription>Étape {currentStep} sur {STEPS.length}</CardDescription></CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded w-fit"><ShieldCheck className="h-3 w-3 text-green-600" /><span>Expert ANETI Activé</span></div>
            <AISettings />
          </div>
          {renderStep()}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="gap-2"><ArrowLeft className="h-4 w-4" /> Précédent</Button>
            {currentStep < STEPS.length && (<Button onClick={nextStep} className="gap-2">Suivant <ArrowRight className="h-4 w-4" /></Button>)}
          </div>
        </CardContent>
      </Card>


      {/* Hidden Charts for Export Capture */}
      {
        isCapturing && (
          <div
            ref={chartContainerRef}
            style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '800px', background: 'white', padding: '20px' }}
          >
            {(() => {
              const results = calculateOperatingResults(data);

              return (
                <>
                  <div id="chart-breakeven" className="w-[800px] h-[400px] bg-white p-4">
                    <h3 className="text-center font-bold mb-2">Seuil de Rentabilité</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results.cvpData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="percentage" fontSize={12} unit="%" />
                        <YAxis fontSize={12} />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" name="Chiffre d'Affaires" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                        <Area type="monotone" dataKey="totalCosts" name="Coûts Totaux" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2} />
                        <Line type="monotone" dataKey="fixedCosts" name="Frais Fixes" stroke="#94A3B8" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div id="chart-evolution" className="w-[800px] h-[400px] bg-white p-4">
                    <h3 className="text-center font-bold mb-2">Évolution du Point Mort</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.breakEvenEvolution} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Legend />
                        <Line type="monotone" dataKey="turnover" name="Chiffre d'Affaires" stroke="#10B981" strokeWidth={3} dot={{ r: 6 }} />
                        <Line type="monotone" dataKey="breakEvenPoint" name="Point Mort" stroke="#F59E0B" strokeWidth={3} strokeDasharray="8 4" dot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div id="chart-profitability" className="w-[800px] h-[400px] bg-white p-4">
                    <h3 className="text-center font-bold mb-2">Rentabilité</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={results.years.map((y, i) => ({ name: `An ${i + 1}`, CA: y.turnover, Net: y.netResult }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Legend />
                        <Bar dataKey="CA" name="Chiffre d'Affaires" fill="#3B82F6" barSize={40} />
                        <Bar dataKey="Net" name="Résultat Net" fill="#10B981" barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div id="chart-cashflow" className="w-[800px] h-[400px] bg-white p-4">
                    <h3 className="text-center font-bold mb-2">Cash Flow Cumulé</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results.cumulativeCFSeries.map(s => ({ ...s, name: `An ${s.year}`, investment: results.summary.totalInvestment }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Legend />
                        <Line type="monotone" dataKey="investment" name="Investissement" stroke="#EF4444" strokeWidth={3} strokeDasharray="8 8" dot={false} />
                        <Area type="monotone" dataKey="cumulative" name="Cash Flow Cumulé" stroke="#059669" fillOpacity={0.3} strokeWidth={4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              );
            })()}
          </div>
        )
      }
    </div>
  );
}
