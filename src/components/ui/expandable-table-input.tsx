import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ExpandableTableInputProps {
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  /** "text" = plain text | "number" = integer | "monetary" = float 3 decimals | "percent" = float 2 decimals */
  type?: "text" | "number" | "monetary" | "percent";
  min?: number;
  max?: number;
  disabled?: boolean;
}

/**
 * Table cell input with expand-on-focus behaviour.
 * For numeric types:
 *  - Accepts both "," and "." as decimal separator
 *  - Never resets to 0 while typing a trailing separator
 *  - "monetary" → formats with 3 decimal places at rest
 *  - "percent"  → formats with 2 decimal places at rest
 *  - "number"   → integer, no decimals
 *  - "text"     → plain string passthrough
 */
export function ExpandableTableInput({
  value,
  onChange,
  placeholder,
  className,
  type = "text",
  min,
  max,
  disabled,
}: ExpandableTableInputProps) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isNumeric = type === "number" || type === "monetary" || type === "percent";
  const decimals = type === "monetary" ? 3 : type === "percent" ? 2 : 0;

  // Format numeric value for display at rest
  const fmtDisplay = (n: number | string): string => {
    if (type === "text") return String(n ?? "");
    const num = typeof n === "string" ? parseFloat(n.replace(",", ".")) : n;
    if (isNaN(num) || num === 0) return "";
    if (decimals === 0) return String(Math.round(num));
    return num.toLocaleString("fr-TN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const parseRaw = (s: string): number => {
    if (!s || s.trim() === "") return 0;
    const normalized = s.replace(/\s/g, "").replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleFocus = () => {
    if (isNumeric) {
      const num = typeof value === "string" ? parseFloat(value) : value;
      setRaw(isNaN(num) || num === 0 ? "" : String(num).replace(".", ","));
    }
    setFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!isNumeric) {
      onChange(v);
      return;
    }
    // Validate: digits, one separator, optional leading minus
    const separators = (v.match(/[.,]/g) || []).length;
    if (separators > 1) return;
    if (/^-?[\d]*[,.]?[\d]*$/.test(v) || v === "" || v === "-") {
      setRaw(v);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    if (isNumeric) {
      let parsed = parseRaw(raw);
      if (min !== undefined && parsed < min) parsed = min;
      if (max !== undefined && parsed > max) parsed = max;
      onChange(parsed);
      setRaw("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") inputRef.current?.blur();
  };

  // What to display
  const displayValue = isNumeric
    ? focused
      ? raw
      : fmtDisplay(value as number)
    : (value as string);

  return (
    <div className="relative h-8 w-full">
      {/* Invisible spacer keeps row height stable */}
      <div className="h-8 w-full pointer-events-none select-none" aria-hidden />

      <input
        ref={inputRef}
        inputMode={isNumeric ? "decimal" : "text"}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "absolute top-0 left-0 h-8 rounded-md border border-transparent",
          "px-3 py-1 text-xs ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none",
          "transition-[width,box-shadow,border-color,background-color] duration-200 ease-in-out",
          isNumeric && "text-right tabular-nums",
          !focused && "w-full z-0 bg-transparent hover:bg-white/[0.04] dark:hover:bg-white/[0.04]",
          focused && "w-[260px] z-50 shadow-xl border-primary ring-2 ring-primary/20 bg-background dark:bg-slate-900",
          className
        )}
      />
    </div>
  );
}
