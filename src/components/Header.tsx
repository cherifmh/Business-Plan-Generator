import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onGetStarted: () => void;
  onHomeClick: () => void;
  showNavLinks: boolean;
}

export function Header({ onGetStarted, onHomeClick, showNavLinks }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onHomeClick}>
          <div className="rounded-lg bg-primary p-2">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">PlanPro</span>
        </div>

        {showNavLinks && (
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Comment ça marche
            </a>
          </nav>
        )}

        {showNavLinks && (
          <Button onClick={onGetStarted}>
            Créer mon plan
          </Button>
        )}
      </div>
    </header>
  );
}
