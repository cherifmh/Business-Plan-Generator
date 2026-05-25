import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { getArabicTranslation } from "@/utils/translations";

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
        <span
          className="text-sm font-bold gradient-text group relative flex items-center gap-2 cursor-help"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {steps && steps[currentStep - 1] ? steps[currentStep - 1].title : ""}
          {steps && steps[currentStep - 1] && getArabicTranslation(steps[currentStep - 1].title) && (
            <>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">ع</span>
              <span
                className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute bottom-full mb-1 right-0 w-max bg-foreground text-background text-xs rounded py-1 px-2 shadow-lg transition-all z-50 pointer-events-none"
                dir="rtl"
              >
                {getArabicTranslation(steps[currentStep - 1].title)}
              </span>
            </>
          )}
        </span>
      </div>

      {/* ── Progress bar (mobile) — navy → gold ── */}
      <div
        className="md:hidden h-1.5 w-full rounded-full overflow-hidden mb-4"
        style={{ background: "hsl(220 15% 88%)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep - 1) / (Math.max(1, (steps?.length || 1) - 1))) * 100}%`,
            background: "linear-gradient(90deg, hsl(220 55% 22%), hsl(38 85% 50%))",
          }}
        />
      </div>

      {/* ── Steps row (desktop) ── */}
      <ol className="hidden md:flex items-center w-full">
        {(steps || []).map((step, index) => {
          if (!step) return null;
          const isCompleted = step.id < currentStep;
          const isCurrent   = step.id === currentStep;
          const isLast      = index === (steps?.length || 1) - 1;

          return (
            <li
              key={step.id || index}
              className={cn("flex items-center", isLast ? "flex-none" : "flex-1")}
            >
              {/* Step button */}
              <button
                onClick={() => onStepClick?.(step.id)}
                title={step.title || ""}
                className="group relative flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
              >
                {/* Circle */}
                <div
                  className={cn(
                    "relative flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-300 border-2",
                    isCurrent && "scale-110",
                    !isCompleted && !isCurrent && "border-foreground/15 bg-foreground/[0.03] text-foreground/40 hover:border-foreground/30 hover:text-foreground/60 hover:bg-foreground/[0.06]"
                  )}
                  style={
                    isCurrent
                      ? {
                          borderColor: "hsl(220 55% 22%)",
                          background:  "hsl(220 55% 22%)",
                          color:       "hsl(38 18% 97%)",
                          boxShadow:   "0 0 0 3px hsl(220 55% 22% / 0.15)",
                        }
                      : isCompleted
                      ? {
                          borderColor: "hsl(145 28% 38%)",
                          background:  "hsl(145 28% 38% / 0.12)",
                          color:       "hsl(145 28% 32%)",
                        }
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span>{step.id}</span>
                  )}

                  {/* Pulse ring on current step — uses gold */}
                  {isCurrent && (
                    <span
                      className="absolute inset-0 rounded-full border-2 animate-ping opacity-20"
                      style={{ borderColor: "hsl(38 85% 52%)" }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-medium whitespace-nowrap transition-colors duration-200 leading-tight text-center max-w-[60px] truncate",
                    !isCompleted && !isCurrent && "text-foreground/40 group-hover:text-foreground/65"
                  )}
                  style={
                    isCurrent
                      ? { color: "hsl(220 55% 22%)", fontWeight: 700 }
                      : isCompleted
                      ? { color: "hsl(145 28% 38%)" }
                      : undefined
                  }
                >
                  {step.title || ""}
                </span>

                {/* Arabic tooltip */}
                {step.title && getArabicTranslation(step.title) && (
                  <span
                    className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 w-max bg-foreground text-background text-[10px] rounded py-1 px-2 shadow-lg transition-all z-50 pointer-events-none"
                    dir="rtl"
                  >
                    {getArabicTranslation(step.title)}
                  </span>
                )}
              </button>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-2 mb-5">
                  <div
                    className="relative h-0.5 rounded-full overflow-hidden"
                    style={{ background: "hsl(220 15% 88%)" }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: isCompleted ? "100%" : isCurrent ? "50%" : "0%",
                        background: "linear-gradient(90deg, hsl(220 55% 22%), hsl(145 28% 32%))",
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
