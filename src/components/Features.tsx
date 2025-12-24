import {
  Calculator,
  FileText,
  Sparkles,
  Download,
  Shield,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Calculator,
    title: "Données numériques",
    description: "Entrez vos projections financières, coûts et revenus avec des calculs automatiques."
  },
  {
    icon: Sparkles,
    title: "Reformulation intelligente",
    description: "Améliorez et professionnalisez vos textes automatiquement."
  },
  {
    icon: FileText,
    title: "Structure complète",
    description: "Un plan d'affaires professionnel avec toutes les sections essentielles."
  },
  {
    icon: Download,
    title: "Export flexible",
    description: "Téléchargez en PDF pour présenter ou en DOCX pour modifier."
  },
  {
    icon: Shield,
    title: "Données sécurisées",
    description: "Vos informations confidentielles restent protégées."
  },
  {
    icon: Clock,
    title: "Rapide et efficace",
    description: "Créez un plan complet en quelques minutes seulement."
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-card/50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            PlanPro combine simplicité et puissance pour créer des plans d'affaires professionnels.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-background/50 backdrop-blur transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="rounded-lg bg-primary/10 p-3 w-fit mb-2">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
