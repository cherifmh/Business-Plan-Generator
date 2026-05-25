import { Calculator, FileText, Sparkles, Download, Shield, Brain, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Calculator,
    color: "hsl(220 55% 22%)",        // midnight navy
    glow: "hsl(220 55% 22% / 0.12)",
    title: "Données financières",
    description: "Projections, coûts, revenus — avec calculs automatiques et validation en temps réel.",
  },
  {
    icon: Brain,
    color: "hsl(145 28% 30%)",        // sovereign olive
    glow: "hsl(145 28% 30% / 0.12)",
    title: "IA intégrée",
    description: "Reformulation intelligente de vos textes pour un rendu professionnel et percutant.",
  },
  {
    icon: FileText,
    color: "hsl(220 45% 30%)",        // navy variant
    glow: "hsl(220 45% 30% / 0.12)",
    title: "Structure complète",
    description: "18+ sections couvrant tous les aspects d'un business plan bancable.",
  },
  {
    icon: Download,
    color: "hsl(38 85% 44%)",         // hammam gold
    glow: "hsl(38 85% 44% / 0.14)",
    title: "Export flexible",
    description: "PDF haute qualité pour vos présentations, DOCX modifiable pour votre équipe.",
  },
  {
    icon: Shield,
    color: "hsl(145 22% 38%)",        // olive-light
    glow: "hsl(145 22% 38% / 0.12)",
    title: "Données privées",
    description: "Tout est traité localement dans votre navigateur. Aucune donnée ne quitte votre appareil.",
  },
  {
    icon: BarChart3,
    color: "hsl(220 55% 18%)",        // deep navy
    glow: "hsl(220 55% 18% / 0.12)",
    title: "Audit stratégique",
    description: "Diagnostic automatique SWOT, ratios financiers, et recommandations personnalisées.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Section separator line */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, hsl(220 55% 10% / 0.12), transparent)" }}
        />
      </div>

      <div className="container relative">

        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-institutional mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Fonctionnalités
          </div>
          <h2
            className="text-4xl font-black tracking-tight sm:text-5xl mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tout ce dont vous avez{" "}
            <span className="gradient-text">besoin</span>
          </h2>
          <p className="text-foreground/50 max-w-2xl mx-auto text-lg">
            Business Plan Generator combine la puissance de l'IA avec une interface intuitive
            pour créer des business plans qui impressionnent les investisseurs et les banques.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative group card-premium rounded-2xl p-6 cursor-default overflow-hidden"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${feature.glow}, transparent 65%)` }}
              />

              {/* Top accent line on hover */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"
                style={{ background: feature.color }}
              />

              {/* Icon */}
              <div className="relative mb-5">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105"
                  style={{ background: feature.color }}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3
                className="text-base font-bold mb-2 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {feature.title}
              </h3>
              <p className="text-sm text-foreground/50 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
