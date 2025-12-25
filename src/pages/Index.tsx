import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { BusinessPlanForm } from "@/components/BusinessPlanForm";
import { BusinessPlanData, ExportFormat } from "@/types/businessPlan";
import { exportBusinessPlan } from "@/utils/exportDocument";
import { demoData } from "@/data/demoData";
import { toast } from "sonner";

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BusinessPlanData | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const handleGetStarted = () => {
    setFormData(undefined);
    setShowForm(true);
    // Scroll to form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleViewDemo = () => {
    setFormData(demoData);
    setShowForm(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleExport = async (data: BusinessPlanData, format: ExportFormat) => {
    if (!data.projectTitle) {
      toast.error("Veuillez renseigner le titre du projet");
      return;
    }

    setIsExporting(true);
    try {
      await exportBusinessPlan(data, format);
      toast.success(
        `Plan d'affaires exporté en ${format.toUpperCase()} avec succès!`
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export du document");
    } finally {
      setIsExporting(false);
    }
  };

  const handleHomeClick = () => {
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onGetStarted={handleGetStarted}
        onHomeClick={handleHomeClick}
        showNavLinks={!showForm}
      />

      {showForm ? (
        <main className="py-12 px-4">
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Retour à l'accueil
            </button>
          </div>
          <BusinessPlanForm onExport={handleExport} isExporting={isExporting} initialValues={formData} />
        </main>
      ) : (
        <>
          <Hero onGetStarted={handleGetStarted} onViewDemo={handleViewDemo} />
          <Features />

          {/* How it works section */}
          <section id="how-it-works" className="py-20">
            <div className="container">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  Comment ça marche?
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Trois étapes simples pour créer votre plan d'affaires professionnel.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "Entrez vos informations",
                    description: "Remplissez le formulaire avec les données de votre entreprise et vos projections financières.",
                  },
                  {
                    step: "02",
                    title: "Reformulation optimisée",
                    description: "Notre moteur d'optimisation s'exécute entièrement dans votre navigateur pour une confidentialité totale. Aucune donnée ne sort.",
                  },
                  {
                    step: "03",
                    title: "Exportez et partagez",
                    description: "Téléchargez votre plan en PDF ou DOCX et présentez-le à vos investisseurs.",
                  },
                ].map((item, index) => (
                  <div key={index} className="relative text-center">
                    <div className="text-6xl font-bold text-primary/10 mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-primary/5">
            <div className="container text-center">
              <h2 className="text-3xl font-bold mb-4">
                Prêt à créer votre plan d'affaires?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Rejoignez des milliers d'entrepreneurs qui ont utilisé PlanPro pour
                concrétiser leurs projets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
                >
                  Commencer gratuitement
                </button>
                <button
                  onClick={handleViewDemo}
                  className="inline-flex items-center justify-center rounded-md bg-white border border-input px-8 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
                >
                  Voir un exemple
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t py-8">
            <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary p-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-primary-foreground"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <span className="font-semibold">PlanPro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} PlanPro. Tous droits réservés.
              </p>
            </div>
          </footer>
        </>
      )
      }
    </div >
  );
};

export default Index;
