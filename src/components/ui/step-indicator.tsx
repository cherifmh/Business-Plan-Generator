import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: { id: number; title: string }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-center gap-2 md:gap-4">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center">
            <button
              onClick={() => onStepClick?.(step.id)}
              disabled={step.id > currentStep}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300",
                step.id === currentStep && "bg-primary text-primary-foreground shadow-lg",
                step.id < currentStep && "bg-primary/20 text-primary hover:bg-primary/30",
                step.id > currentStep && "bg-muted/50 text-muted-foreground cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                  step.id === currentStep && "bg-primary-foreground/20",
                  step.id < currentStep && "bg-primary text-primary-foreground",
                  step.id > currentStep && "bg-muted"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </span>
              <span className="hidden md:inline">{step.title}</span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-8 md:w-12 transition-colors duration-300",
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
