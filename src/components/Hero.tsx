import { ArrowRight, FileText, Download, Sparkles, TrendingUp, Shield } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
  onViewDemo: () => void;
}

export function Hero({ onGetStarted, onViewDemo }: HeroProps) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-mesh">

      {/* ── Subtle institutional ambient layer ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Navy top-left wash */}
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.06] animate-float-up"
          style={{
            background: "radial-gradient(circle, hsl(220 55% 10%) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Olive bottom-right accent */}
        <div
          className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.05] animate-float-down"
          style={{
            background: "radial-gradient(circle, hsl(145 28% 28%) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Gold centre pulse */}
        <div
          className="absolute top-1/3 left-1/2 w-[300px] h-[300px] rounded-full opacity-[0.04] animate-float-up-delay"
          style={{
            background: "radial-gradient(circle, hsl(38 85% 52%) 0%, transparent 70%)",
            filter: "blur(60px)",
            transform: "translateX(-50%)",
          }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(220 55% 10%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 55% 10%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container relative z-10 py-20 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-2 items-center">

          {/* ── Left — Copy ── */}
          <div className="flex flex-col gap-8">

            {/* Badge */}
            <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full badge-institutional animate-fade-in-up">
              <Sparkles className="h-3.5 w-3.5" />
              Générateur de business plan alimenté par l'IA
            </div>

            {/* Headline */}
            <div className="animate-fade-in-up animate-delay-100">
              <h1
                className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl leading-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Créez votre
                <br />
                <span className="gradient-text">plan d'affaires</span>
                <br />
                <span className="text-foreground/75">en minutes.</span>
              </h1>
            </div>

            {/* Sub */}
            <p className="text-lg text-foreground/55 max-w-md leading-relaxed animate-fade-in-up animate-delay-200">
              Entrez vos données, laissez l'IA professionnaliser vos textes,
              et exportez un document bancable en{" "}
              <span className="gradient-text-gold font-semibold">PDF ou DOCX</span>.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-delay-300">
              <button
                onClick={onGetStarted}
                className="group flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold btn-primary"
              >
                Commencer maintenant
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={onViewDemo}
                className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-semibold border border-foreground/15 text-foreground/70 hover:text-foreground hover:border-foreground/25 hover:bg-foreground/[0.03] transition-all duration-200"
              >
                <FileText className="h-4 w-4" />
                Voir un exemple
              </button>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 pt-4 border-t border-foreground/[0.08] animate-fade-in-up animate-delay-400">
              {[
                { value: "5 min", label: "Temps moyen" },
                { value: "PDF/DOCX", label: "Export pro" },
                { value: "100%", label: "Confidentiel" },
              ].map((stat) => (
                <div key={stat.value}>
                  <div
                    className="text-2xl font-black gradient-text"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-foreground/40 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right — Document preview card ── */}
          <div className="relative flex items-center justify-center animate-fade-in-up animate-delay-300">

            {/* Main card */}
            <div className="relative w-full max-w-sm">
              {/* Subtle glow behind card */}
              <div
                className="absolute inset-0 rounded-3xl opacity-20 blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(220 55% 20% / 0.4), hsl(38 85% 52% / 0.2))",
                }}
              />

              {/* Main panel — light institutional card */}
              <div className="relative bg-white rounded-3xl border border-foreground/[0.08] p-6 shadow-xl">
                {/* Header row */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-foreground/40 uppercase tracking-widest mb-1">Business Plan</p>
                    <h3
                      className="text-lg font-bold text-foreground"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      TechLaunch SAS
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-700 font-medium">Prêt</span>
                  </div>
                </div>

                {/* Progress bars — institutional colors */}
                <div className="space-y-4 mb-6">
                  {[
                    { label: "Analyse de marché", pct: 92, color: "hsl(220 55% 22%)" },
                    { label: "Plan financier", pct: 78, color: "hsl(145 28% 32%)" },
                    { label: "Stratégie marketing", pct: 85, color: "hsl(38 85% 50%)" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-foreground/60">{item.label}</span>
                        <span className="text-foreground/40 tabular-nums">{item.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.pct}%`, background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score boxes */}
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl bg-foreground/[0.03] border border-foreground/[0.06] p-3 text-center">
                    <p className="text-2xl font-black gradient-text" style={{ fontFamily: "var(--font-display)" }}>A+</p>
                    <p className="text-xs text-foreground/40 mt-0.5">Score bancaire</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-foreground/[0.03] border border-foreground/[0.06] p-3 text-center">
                    <p className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "hsl(145 28% 32%)" }}>18</p>
                    <p className="text-xs text-foreground/40 mt-0.5">Sections</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-foreground/[0.03] border border-foreground/[0.06] p-3 text-center">
                    <p className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "hsl(220 55% 22%)" }}>42</p>
                    <p className="text-xs text-foreground/40 mt-0.5">Pages</p>
                  </div>
                </div>
              </div>

              {/* Floating badge — profitability */}
              <div className="absolute -left-14 top-8 bg-white rounded-2xl border border-foreground/[0.08] p-3 shadow-lg animate-float-up">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: "hsl(145 28% 28%)" }}>
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Rentabilité</p>
                    <p className="text-[10px] text-emerald-600 font-medium">+32% ROI</p>
                  </div>
                </div>
              </div>

              {/* Floating badge — export */}
              <div className="absolute -right-14 bottom-8 bg-white rounded-2xl border border-foreground/[0.08] p-3 shadow-lg animate-float-down">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: "hsl(220 55% 22%)" }}>
                    <Download className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Export réussi</p>
                    <p className="text-[10px] font-medium" style={{ color: "hsl(38 85% 45%)" }}>PDF · 42 pages</p>
                  </div>
                </div>
              </div>

              {/* Floating badge — security */}
              <div className="absolute -right-10 top-4 bg-white rounded-2xl border border-foreground/[0.08] p-3 shadow-md animate-float-up-delay">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: "hsl(145 28% 40%)" }} />
                  <p className="text-[10px] font-semibold text-foreground/70">100% privé</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
