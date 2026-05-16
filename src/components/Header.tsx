import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X, BarChart2, Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface HeaderProps {
  onGetStarted: () => void;
  onHomeClick: () => void;
  showNavLinks: boolean;
}

export function Header({ onGetStarted, onHomeClick, showNavLinks }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "glass border-b border-white/[0.06] shadow-lg shadow-black/30"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="container flex h-16 items-center justify-between">

          {/* ── Logo ── */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={onHomeClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onHomeClick()}
          >
            {/* Animated logo mark */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 blur-md opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 shadow-lg">
                {/* Custom BP icon */}
                <BarChart2 className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Brand name */}
            <div className="flex flex-col leading-none">
              <span
                className="text-[11px] font-semibold tracking-[0.18em] uppercase text-foreground/40"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Business
              </span>
              <span
                className="text-base font-black tracking-tight gradient-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Plan Generator
              </span>
            </div>
          </div>

          {/* ── Nav links ── */}
          {showNavLinks && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: "Fonctionnalités", href: "#features" },
                { label: "Comment ça marche", href: "#how-it-works" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-white/[0.05] group"
                >
                  {link.label}
                  <span className="absolute bottom-1 left-4 right-4 h-px bg-gradient-to-r from-indigo-500 to-violet-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </a>
              ))}
            </nav>
          )}

          {/* ── Right actions ── */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              className="flex items-center justify-center w-9 h-9 rounded-xl glass border border-white/10 text-foreground/60 hover:text-foreground hover:border-white/20 transition-all duration-200 hover:scale-105"
              aria-label="Changer le thème"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-400" />
              )}
            </button>

            {/* CTA */}
            {showNavLinks && (
              <button
                onClick={onGetStarted}
                className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white btn-glow"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Commencer
              </button>
            )}

            {/* Mobile toggle */}
            {showNavLinks && (
              <button
                className="md:hidden p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      {showNavLinks && mobileOpen && (
        <div
          className="fixed inset-0 z-40 pt-16 glass md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex flex-col gap-2 p-6" onClick={(e) => e.stopPropagation()}>
            <a
              href="#features"
              className="px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/[0.06] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Fonctionnalités
            </a>
            <a
              href="#how-it-works"
              className="px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/[0.06] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Comment ça marche
            </a>
            <button
              onClick={() => { setMobileOpen(false); onGetStarted(); }}
              className="mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white btn-glow"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Commencer gratuitement
            </button>
          </div>
        </div>
      )}
    </>
  );
}
