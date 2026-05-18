import { useEffect, useState, lazy, Suspense } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
const BusinessPlanForm = lazy(() => import("@/components/BusinessPlanForm").then(module => ({ default: module.BusinessPlanForm })));
import { BusinessPlanData, ExportFormat } from "@/types/businessPlan";
import { exportBusinessPlan } from "@/utils/exportDocument";
import { demoData } from "@/data/demoData";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  FileText,
  BarChart2,
  Sparkles,
  ArrowRight,
  ClipboardList,
  Cpu,
  PackageOpen,
  ChevronRight,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   HOW IT WORKS — steps data
──────────────────────────────────────────────────────────── */
const steps = [
  {
    icon: ClipboardList,
    color: "from-indigo-500 to-violet-600",
    glow: "hsl(245 100% 70% / 0.25)",
    step: "01",
    title: "Entrez vos informations",
    description:
      "Remplissez le formulaire guidé avec les données de votre entreprise, votre marché et vos projections financières.",
  },
  {
    icon: Cpu,
    color: "from-violet-500 to-pink-600",
    glow: "hsl(270 70% 60% / 0.25)",
    step: "02",
    title: "L'IA optimise votre contenu",
    description:
      "Notre moteur s'exécute entièrement dans votre navigateur pour une confidentialité totale. Vos textes sont professionnalisés automatiquement.",
  },
  {
    icon: PackageOpen,
    color: "from-cyan-500 to-blue-600",
    glow: "hsl(199 89% 55% / 0.25)",
    step: "03",
    title: "Exportez et présentez",
    description:
      "Téléchargez votre plan en PDF ou DOCX, prêt à soumettre à vos investisseurs, banques ou partenaires.",
  },
];

/* ────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────── */
const Index = () => {
  const [showForm, setShowForm] = useState(() => {
    return sessionStorage.getItem("bpg_show_form") === "true";
  });
  const [formData, setFormData] = useState<BusinessPlanData | undefined>(undefined);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return sessionStorage.getItem("bpg_demo_mode") === "true";
  });
  // Incrementing this key forces BusinessPlanForm to fully unmount+remount,
  // guaranteeing all internal state (including useState lazy-init) resets.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    sessionStorage.setItem("bpg_show_form", showForm.toString());
  }, [showForm]);

  useEffect(() => {
    sessionStorage.setItem("bpg_demo_mode", isDemoMode.toString());
  }, [isDemoMode]);

  const handleGetStarted = () => {
    // Clear any saved draft so the new form starts completely empty
    localStorage.removeItem("bpg_draft_data");
    setFormData(undefined);
    setIsDemoMode(false);
    setFormKey((k) => k + 1); // force full remount
    setShowForm(true);
    sessionStorage.removeItem("bpg_current_step");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleViewDemo = () => {
    setFormData(demoData);
    setIsDemoMode(true);
    setFormKey((k) => k + 1); // force full remount
    setShowForm(true);
    sessionStorage.removeItem("bpg_current_step");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleExport = async (data: BusinessPlanData, format: ExportFormat) => {
    if (!data.projectTitle) {
      toast.error("Veuillez renseigner le titre du projet");
      return;
    }
    setIsExporting(format);
    try {
      await exportBusinessPlan(data, format);
      toast.success(`Plan d'affaires exporté en ${format.toUpperCase()} avec succès!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export du document");
    } finally {
      setIsExporting(null);
    }
  };

  const handleHomeClick = () => {
    setShowForm(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [showForm]);

  return (
    <div className="bg-background min-h-screen">
      <Header
        onGetStarted={handleGetStarted}
        onHomeClick={handleHomeClick}
        showNavLinks={!showForm}
      />

      {/* ══════════════════════════════════════════════════
          FORM VIEW
      ══════════════════════════════════════════════════ */}
      {showForm ? (
        <main className="py-6 px-3 sm:px-4">
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground transition-colors group"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-1" />
              Retour à l'accueil
            </button>
          </div>
          <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <BusinessPlanForm
              key={formKey}
              onExport={handleExport}
              isExporting={isExporting}
              initialValues={formData}
              isDemoMode={isDemoMode}
              onExitDemoMode={handleGetStarted}
            />
          </Suspense>
        </main>
      ) : (

        /* ══════════════════════════════════════════════════
            LANDING PAGE
        ══════════════════════════════════════════════════ */
        <>
          <Hero onGetStarted={handleGetStarted} onViewDemo={handleViewDemo} />
          <Features />

          {/* ── HOW IT WORKS ── */}
          <section id="how-it-works" className="relative py-32 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 50% at 50% 100%, hsl(245 100% 70% / 0.08), transparent)",
                }}
              />
            </div>

            <div className="container relative">
              <div className="text-center mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/20 text-sm font-medium text-indigo-300 mb-6">
                  <Sparkles className="h-3.5 w-3.5" />
                  Processus
                </div>
                <h2
                  className="text-4xl font-black tracking-tight sm:text-5xl mb-6"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Comment ça{" "}
                  <span className="gradient-text">marche ?</span>
                </h2>
                <p className="text-foreground/50 max-w-xl mx-auto text-lg">
                  Trois étapes simples pour créer votre plan d'affaires professionnel.
                </p>
              </div>

              {/* Steps */}
              <div className="relative grid gap-8 md:grid-cols-3">
                {/* Connector line */}
                <div className="hidden md:block absolute top-[52px] left-[33%] right-[33%] h-px bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-cyan-500/30" />

                {steps.map((s, index) => (
                  <div key={index} className="relative flex flex-col items-center text-center group">
                    {/* Step icon */}
                    <div className="relative mb-6">
                      <div
                        className="absolute inset-0 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: `linear-gradient(135deg, ${s.glow}, transparent)` }}
                      />
                      <div
                        className={`relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} shadow-xl group-hover:scale-110 transition-transform duration-300`}
                      >
                        <s.icon className="h-7 w-7 text-white" />
                      </div>
                      {/* Step number badge */}
                      <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-white/20 text-[10px] font-black text-foreground/60">
                        {s.step}
                      </div>
                    </div>

                    <h3
                      className="text-lg font-bold mb-3"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {s.title}
                    </h3>
                    <p className="text-sm text-foreground/50 leading-relaxed max-w-xs">
                      {s.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA SECTION ── */}
          <section className="relative py-32 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              {/* Gradient background */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(245 100% 70% / 0.1), transparent 70%)",
                }}
              />
              {/* Top & bottom borders */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: "linear-gradient(90deg, transparent, hsl(245 100% 70% / 0.3), transparent)",
                }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                  background: "linear-gradient(90deg, transparent, hsl(245 100% 70% / 0.15), transparent)",
                }}
              />
            </div>

            <div className="container relative text-center">
              {/* Floating icon */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl blur-xl bg-indigo-500/30 animate-pulse" />
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>

              <h2
                className="text-4xl font-black tracking-tight sm:text-5xl mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Prêt à concrétiser
                <br />
                <span className="gradient-text">votre projet ?</span>
              </h2>
              <p className="text-foreground/50 mb-10 max-w-xl mx-auto text-lg">
                Rejoignez des milliers d'entrepreneurs qui ont utilisé
                <span className="text-indigo-400 font-medium"> Business Plan Generator</span> pour
                impressionner leurs investisseurs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white btn-glow"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={handleViewDemo}
                  className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold glass border border-white/10 text-foreground/70 hover:text-foreground hover:border-white/20 transition-all duration-300"
                >
                  <FileText className="h-4 w-4" />
                  Voir un exemple
                </button>
              </div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer className="relative border-t border-white/[0.06] py-12">
            <div className="container">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Brand */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
                    <BarChart2 className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span
                      className="text-[10px] font-semibold tracking-[0.18em] uppercase text-foreground/40"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Business
                    </span>
                    <span
                      className="text-sm font-black tracking-tight gradient-text"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Plan Generator
                    </span>
                  </div>
                </div>

                {/* Links */}
                <nav className="flex items-center gap-6">
                  {[
                    { label: "Fonctionnalités", href: "#features" },
                    { label: "Comment ça marche", href: "#how-it-works" },
                  ].map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="text-sm text-foreground/40 hover:text-foreground/80 transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>

                {/* Copyright */}
                <p className="text-sm text-foreground/30">
                  © {new Date().getFullYear()} Business Plan Generator · Tous droits réservés.
                </p>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default Index;
