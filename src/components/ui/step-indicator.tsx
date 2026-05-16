import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: { id: number; title: string }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <nav aria-label="Progression" className="mb-6 w-full">
      {/* ── Current step label (mobile) ── */}
      <div className="flex items-center justify-between mb-3 md:hidden px-1">
        <span className="text-xs text-foreground/50 font-medium">
          Étape {currentStep} / {steps?.length || 0}
        </span>
        <span className="text-sm font-bold gradient-text" style={{ fontFamily: "var(--font-display)" }}>
          {steps && steps[currentStep - 1] ? steps[currentStep - 1].title : ""}
        </span>
      </div>

      {/* ── Progress bar (mobile) ── */}
      <div className="md:hidden h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (Math.max(1, (steps?.length || 1) - 1))) * 100}%` }}
        />
      </div>

      {/* ── Steps row (desktop) ── */}
      <ol className="hidden md:flex items-center w-full">
        {(steps || []).map((step, index) => {
          if (!step) return null;
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isAccessible = true; // All steps are now fully accessible
          const isLast = index === (steps?.length || 1) - 1;

          return (
            <li
              key={step.id || index}
              className={cn("flex items-center", isLast ? "flex-none" : "flex-1")}
            >
              {/* Step button */}
              <button
                onClick={() => onStepClick?.(step.id)}
                title={step.title || ""}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                )}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "relative flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-300 border-2",
                    isCurrent && "border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110",
                    isCompleted && "border-indigo-500/60 bg-indigo-500/20 text-indigo-400",
                    !isCompleted && !isCurrent && "border-white/20 bg-white/[0.04] text-foreground/40 hover:border-indigo-400/40 hover:text-foreground/60 hover:bg-white/[0.08]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span>{step.id}</span>
                  )}

                  {/* Pulse ring on current */}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-30" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-medium whitespace-nowrap transition-colors duration-200 leading-tight text-center max-w-[60px] truncate",
                    isCurrent && "text-indigo-400",
                    isCompleted && "text-foreground/50",
                    !isCompleted && !isCurrent && "text-foreground/40 group-hover:text-foreground/70"
                  )}
                >
                  {step.title || ""}
                </span>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-2 mb-5">
                  <div className="relative h-0.5 rounded-full overflow-hidden bg-white/[0.06]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                      style={{
                        width: isCompleted ? "100%" : isCurrent ? "50%" : "0%",
                      }}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
