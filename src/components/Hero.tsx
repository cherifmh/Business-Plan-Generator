import { ArrowRight, FileText, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroIllustration from "@/assets/hero-illustration.png";

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <div className="container relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Content */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mx-auto lg:mx-0 w-fit">
              <Sparkles className="h-4 w-4" />
              Propulsé par l'IA
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Créez votre{" "}
              <span className="text-primary">plan d'affaires</span>{" "}
              en quelques minutes
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Transformez vos idées en un plan d'affaires professionnel. 
              Entrez vos données, laissez l'IA reformuler vos textes, 
              et exportez en PDF ou DOCX.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={onGetStarted} className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                Commencer maintenant
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                Voir un exemple
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border/50 mt-4">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary">5 min</div>
                <div className="text-sm text-muted-foreground">Temps moyen</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary">PDF/DOCX</div>
                <div className="text-sm text-muted-foreground">Export flexible</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Personnalisable</div>
              </div>
            </div>
          </div>
          
          {/* Illustration */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
            <img
              src={heroIllustration}
              alt="Illustration de création de plan d'affaires"
              className="relative z-10 rounded-2xl shadow-2xl"
            />
            
            {/* Floating cards */}
            <div className="absolute -left-4 top-1/4 z-20 rounded-xl bg-card p-4 shadow-xl animate-bounce" style={{ animationDuration: "3s" }}>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Plan généré</div>
                  <div className="text-xs text-muted-foreground">15 pages</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-4 bottom-1/4 z-20 rounded-xl bg-card p-4 shadow-xl animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Export réussi</div>
                  <div className="text-xs text-muted-foreground">PDF prêt</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
