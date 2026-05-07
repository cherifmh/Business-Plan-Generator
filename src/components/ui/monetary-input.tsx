import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MonetaryInputProps {
  /** Stored numeric value (from state) */
  value: number;
  /** Called with the parsed float on commit (blur / Enter) */
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  /** If true, show 3-decimal monetary display; if false (e.g. quantities) use 0 decimals */
  monetary?: boolean;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  disabled?: boolean;
  id?: string;
}

/**
 * Numeric input that:
 *  - Accepts both "," and "." as decimal separator during editing
 *  - Never resets to 0 when the user types a trailing comma/dot
 *  - Formats to 3 decimal places (monetary) or 0 (integer) on blur
 *  - Calls onChange only with a valid, committed number
 */
export function MonetaryInput({
  value,
  onChange,
  placeholder,
  className,
  monetary = true,
  min,
  max,
  disabled,
  id,
}: MonetaryInputProps) {
  const decimals = monetary ? 3 : 0;

  // Format a number for display (at rest / on blur)
  const fmt = (n: number) =>
    isNaN(n) || n === 0
      ? ""
      : n.toLocaleString("fr-TN", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });

  // Raw editable string (while focused)
  const [raw, setRaw] = useState<string>("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Displayed value: raw while editing, formatted at rest
  const displayValue = focused ? raw : fmt(value);

  const handleFocus = () => {
    // On focus: show the plain numeric string (no thousand separators)
    setRaw(value === 0 || isNaN(value) ? "" : String(value).replace(".", ","));
    setFocused(true);
  };

  const parseRaw = (s: string): number => {
    if (!s || s.trim() === "") return 0;
    // Replace comma decimal separator with dot
    const normalized = s.replace(/\s/g, "").replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // Allow: digits, one comma OR one dot, leading minus
    // Block multiple separators
    const separators = (v.match(/[.,]/g) || []).length;
    if (separators > 1) return;
    // Allow only: 0-9, comma, dot, minus at start
    if (/^-?[\d]*[,.]?[\d]*$/.test(v) || v === "" || v === "-") {
      setRaw(v);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseRaw(raw);
    const clamped =
      min !== undefined && parsed < min ? min
      : max !== undefined && parsed > max ? max
      : parsed;
    onChange(clamped);
    setRaw("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      id={id}
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder ?? (monetary ? "0,000" : "0")}
      disabled={disabled}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm",
        "ring-offset-background placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "text-right tabular-nums",
        className
      )}
    />
  );
}
