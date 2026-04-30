import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: { id: number; title: string }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-8 w-full overflow-x-auto">
      <ol className="flex items-center justify-start gap-1 min-w-max px-2 mx-auto md:justify-center md:min-w-0">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center">
            <button
              onClick={() => onStepClick?.(step.id)}
              disabled={step.id > currentStep}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-300",
                step.id === currentStep && "bg-primary text-primary-foreground shadow-lg",
                step.id < currentStep && "bg-primary/20 text-primary hover:bg-primary/30",
                step.id > currentStep && "bg-muted/50 text-muted-foreground cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                  step.id === currentStep && "bg-primary-foreground/20",
                  step.id < currentStep && "bg-primary text-primary-foreground",
                  step.id > currentStep && "bg-muted"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-3 w-3" />
                ) : (
                  step.id
                )}
              </span>
              {/* Only show title on active step at md+ breakpoints */}
              {step.id === currentStep && (
                <span className="hidden md:inline whitespace-nowrap">
                  {step.title}
                </span>
              )}
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-3 flex-shrink-0 transition-colors duration-300",
                  step.id < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
