import { Calculator, FileText, Sparkles, Download, Shield, Clock, Brain, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Calculator,
    color: "from-indigo-500 to-violet-600",
    glow: "hsl(245 100% 70% / 0.2)",
    title: "Données financières",
    description: "Projections, coûts, revenus — avec calculs automatiques et validation en temps réel.",
  },
  {
    icon: Brain,
    color: "from-violet-500 to-pink-600",
    glow: "hsl(270 70% 60% / 0.2)",
    title: "IA intégrée",
    description: "Reformulation intelligente de vos textes pour un rendu professionnel et percutant.",
  },
  {
    icon: FileText,
    color: "from-cyan-500 to-blue-600",
    glow: "hsl(199 89% 55% / 0.2)",
    title: "Structure complète",
    description: "18+ sections couvrant tous les aspects d'un business plan bancable.",
  },
  {
    icon: Download,
    color: "from-emerald-500 to-teal-600",
    glow: "hsl(142 71% 45% / 0.2)",
    title: "Export flexible",
    description: "PDF haute qualité pour vos présentations, DOCX modifiable pour votre équipe.",
  },
  {
    icon: Shield,
    color: "from-amber-500 to-orange-600",
    glow: "hsl(48 96% 53% / 0.2)",
    title: "Données privées",
    description: "Tout est traité localement dans votre navigateur. Aucune donnée ne quitte votre appareil.",
  },
  {
    icon: BarChart3,
    color: "from-rose-500 to-red-600",
    glow: "hsl(0 84% 60% / 0.2)",
    title: "Audit stratégique",
    description: "Diagnostic automatique SWOT, ratios financiers, et recommandations personnalisées.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, hsl(245 100% 70% / 0.3), transparent)" }}
        />
      </div>

      <div className="container relative">

        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/20 text-sm font-medium text-indigo-300 mb-6">
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
              className="relative group card-hover glass rounded-2xl border border-white/[0.06] p-6 cursor-default overflow-hidden"
            >
              {/* Card glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${feature.glow}, transparent 60%)` }}
              />

              {/* Top shimmer line */}
              <div
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${feature.glow.replace('0.2', '0.8')}, transparent)` }}
              />

              {/* Icon */}
              <div className="relative mb-5">
                <div
                  className="absolute inset-0 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${feature.glow}, transparent)` }}
                />
                <div
                  className={`relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3
                className="text-base font-bold mb-2 text-foreground group-hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {feature.title}
              </h3>
              <p className="text-sm text-foreground/50 leading-relaxed group-hover:text-foreground/60 transition-colors">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
