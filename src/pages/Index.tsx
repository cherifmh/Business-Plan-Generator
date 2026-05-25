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
   HOW IT WORKS — steps data (institutional palette)
──────────────────────────────────────────────────────────── */
const steps = [
  {
    icon: ClipboardList,
    color: "hsl(220 55% 22%)",          // midnight navy
    glow: "hsl(220 55% 22% / 0.15)",
    step: "01",
    title: "Entrez vos informations",
    description:
      "Remplissez le formulaire guidé avec les données de votre entreprise, votre marché et vos projections financières.",
  },
  {
    icon: Cpu,
    color: "hsl(145 28% 30%)",          // sovereign olive
    glow: "hsl(145 28% 30% / 0.15)",
    step: "02",
    title: "L'IA optimise votre contenu",
    description:
      "Notre moteur s'exécute entièrement dans votre navigateur pour une confidentialité totale. Vos textes sont professionnalisés automatiquement.",
  },
  {
    icon: PackageOpen,
    color: "hsl(38 85% 44%)",           // hammam gold
    glow: "hsl(38 85% 44% / 0.18)",
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
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    sessionStorage.setItem("bpg_show_form", showForm.toString());
  }, [showForm]);

  useEffect(() => {
    sessionStorage.setItem("bpg_demo_mode", isDemoMode.toString());
  }, [isDemoMode]);

  const handleGetStarted = () => {
    localStorage.removeItem("bpg_draft_data");
    setFormData(undefined);
    setIsDemoMode(false);
    setFormKey((k) => k + 1);
    setShowForm(true);
    sessionStorage.removeItem("bpg_current_step");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleViewDemo = () => {
    setFormData(demoData);
    setIsDemoMode(true);
    setFormKey((k) => k + 1);
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
            {/* Sand-tinted background strip */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "hsl(38 22% 95%)" }} />

            <div className="container relative">
              <div className="text-center mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-institutional mb-6">
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
                <div
                  className="hidden md:block absolute top-[32px] left-[33%] right-[33%] h-px"
                  style={{ background: "linear-gradient(90deg, hsl(220 55% 22% / 0.25), hsl(38 85% 44% / 0.35))" }}
                />

                {steps.map((s, index) => (
                  <div key={index} className="relative flex flex-col items-center text-center group">
                    {/* Step icon */}
                    <div className="relative mb-6">
                      <div
                        className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                        style={{ background: s.glow }}
                      />
                      <div
                        className="relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-300"
                        style={{ background: s.color }}
                      >
                        <s.icon className="h-7 w-7 text-white" />
                      </div>
                      {/* Step number badge */}
                      <div
                        className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full border-2 border-white text-[10px] font-black text-white shadow-sm"
                        style={{ background: "hsl(220 55% 22%)" }}
                      >
                        {s.step}
                      </div>
                    </div>

                    <h3
                      className="text-lg font-bold mb-3 text-foreground"
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
              {/* Deep navy background */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(160deg, hsl(220 55% 10%) 0%, hsl(220 45% 14%) 100%)" }}
              />
              {/* Olive accent wash */}
              <div
                className="absolute inset-0 opacity-30"
                style={{ background: "radial-gradient(ellipse 70% 50% at 80% 50%, hsl(145 28% 22% / 0.8), transparent)" }}
              />
              {/* Gold shimmer spot */}
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: "radial-gradient(ellipse 40% 40% at 15% 80%, hsl(38 85% 52% / 0.6), transparent)" }}
              />
              {/* Top border */}
              <div
                className="absolute top-0 left-0 right-0 h-px opacity-20"
                style={{ background: "linear-gradient(90deg, transparent, hsl(38 85% 52%), transparent)" }}
              />
            </div>

            <div className="container relative text-center">
              {/* Icon cluster */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-2xl blur-xl opacity-50"
                    style={{ background: "hsl(38 85% 52%)" }}
                  />
                  <div
                    className="relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl"
                    style={{ background: "linear-gradient(135deg, hsl(38 85% 48%), hsl(38 75% 60%))" }}
                  >
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>

              <h2
                className="text-4xl font-black tracking-tight sm:text-5xl mb-6 text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Prêt à concrétiser
                <br />
                <span className="gradient-text-gold">votre projet ?</span>
              </h2>
              <p className="mb-10 max-w-xl mx-auto text-lg" style={{ color: "hsl(38 18% 95% / 0.60)" }}>
                Rejoignez des milliers d'entrepreneurs qui ont utilisé{" "}
                <span className="font-semibold" style={{ color: "hsl(38 75% 65%)" }}>Business Plan Generator</span>{" "}pour
                impressionner leurs investisseurs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold btn-gold"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={handleViewDemo}
                  className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-semibold border transition-all duration-200"
                  style={{
                    borderColor: "hsl(38 18% 95% / 0.20)",
                    color: "hsl(38 18% 95% / 0.75)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "hsl(38 18% 95% / 0.35)";
                    e.currentTarget.style.color = "hsl(38 18% 97%)";
                    e.currentTarget.style.background = "hsl(38 18% 95% / 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "hsl(38 18% 95% / 0.20)";
                    e.currentTarget.style.color = "hsl(38 18% 95% / 0.75)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Voir un exemple
                </button>
              </div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer className="relative border-t py-12" style={{ borderColor: "hsl(220 15% 88%)" }}>
            <div className="container">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Brand */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-xl shadow-md"
                    style={{ background: "linear-gradient(135deg, hsl(220 55% 16%), hsl(220 45% 24%))" }}
                  >
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
                      className="text-sm text-foreground/40 hover:text-foreground/75 transition-colors"
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
