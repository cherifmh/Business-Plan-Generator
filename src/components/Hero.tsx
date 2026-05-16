import { ArrowRight, FileText, Download, Sparkles, TrendingUp, Shield } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
  onViewDemo: () => void;
}

export function Hero({ onGetStarted, onViewDemo }: HeroProps) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-mesh">

      {/* ── Animated ambient orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 animate-float-up"
          style={{
            background: "radial-gradient(circle, hsl(245 100% 70%) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-15 animate-float-down"
          style={{
            background: "radial-gradient(circle, hsl(270 70% 60%) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute top-1/3 left-1/2 w-[300px] h-[300px] rounded-full opacity-10 animate-float-up-delay"
          style={{
            background: "radial-gradient(circle, hsl(199 89% 55%) 0%, transparent 70%)",
            filter: "blur(40px)",
            transform: "translateX(-50%)",
          }}
        />

        {/* Grid lines overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(213 31% 91%) 1px, transparent 1px), linear-gradient(90deg, hsl(213 31% 91%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container relative z-10 py-20 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-2 items-center">

          {/* ── Left — Copy ── */}
          <div className="flex flex-col gap-8">

            {/* Badge */}
            <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/20 text-sm font-medium text-indigo-300 animate-fade-in-up">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
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
                <span className="text-foreground/80">en minutes.</span>
              </h1>
            </div>

            {/* Sub */}
            <p className="text-lg text-foreground/50 max-w-md leading-relaxed animate-fade-in-up animate-delay-200">
              Entrez vos données, laissez l'IA professionnaliser vos textes,
              et exportez un document bancable en{" "}
              <span className="text-indigo-400 font-medium">PDF ou DOCX</span>.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-delay-300">
              <button
                onClick={onGetStarted}
                className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white btn-glow"
              >
                Commencer maintenant
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={onViewDemo}
                className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold glass border border-white/10 text-foreground/80 hover:text-foreground hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5"
              >
                <FileText className="h-4 w-4" />
                Voir un exemple
              </button>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 pt-4 border-t border-white/[0.06] animate-fade-in-up animate-delay-400">
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

          {/* ── Right — Visual card stack ── */}
          <div className="relative flex items-center justify-center animate-fade-in-up animate-delay-300">

            {/* Main card */}
            <div className="relative w-full max-w-sm">
              {/* Background glow */}
              <div
                className="absolute inset-0 rounded-3xl opacity-40 blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(245 100% 70% / 0.3), hsl(270 70% 60% / 0.3))",
                }}
              />

              {/* Main panel */}
              <div className="relative glass rounded-3xl border border-white/10 p-6 shadow-2xl">
                {/* Header row */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-foreground/40 uppercase tracking-widest mb-1">Business Plan</p>
                    <h3
                      className="text-lg font-bold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      TechLaunch SAS
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">Prêt</span>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-4 mb-6">
                  {[
                    { label: "Analyse de marché", pct: 92, color: "from-indigo-500 to-violet-500" },
                    { label: "Plan financier", pct: 78, color: "from-violet-500 to-pink-500" },
                    { label: "Stratégie marketing", pct: 85, color: "from-cyan-500 to-blue-500" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-foreground/60">{item.label}</span>
                        <span className="text-foreground/40">{item.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score */}
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
                    <p className="text-2xl font-black gradient-text" style={{ fontFamily: "var(--font-display)" }}>A+</p>
                    <p className="text-xs text-foreground/40 mt-0.5">Score bancaire</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
                    <p className="text-2xl font-black text-emerald-400" style={{ fontFamily: "var(--font-display)" }}>18</p>
                    <p className="text-xs text-foreground/40 mt-0.5">Sections</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
                    <p className="text-2xl font-black text-sky-400" style={{ fontFamily: "var(--font-display)" }}>42</p>
                    <p className="text-xs text-foreground/40 mt-0.5">Pages</p>
                  </div>
                </div>
              </div>

              {/* Floating badge — top left */}
              <div className="absolute -left-12 top-8 glass rounded-2xl border border-white/10 p-3 shadow-xl animate-float-up">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Rentabilité</p>
                    <p className="text-[10px] text-emerald-400">+32% ROI</p>
                  </div>
                </div>
              </div>

              {/* Floating badge — bottom right */}
              <div className="absolute -right-12 bottom-8 glass rounded-2xl border border-white/10 p-3 shadow-xl animate-float-down">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                    <Download className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Export réussi</p>
                    <p className="text-[10px] text-sky-400">PDF · 42 pages</p>
                  </div>
                </div>
              </div>

              {/* Floating badge — security */}
              <div className="absolute -right-8 top-4 glass rounded-2xl border border-white/10 p-3 shadow-xl animate-float-up-delay">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <p className="text-[10px] font-medium text-foreground/70">100% privé</p>
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
