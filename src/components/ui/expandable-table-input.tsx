import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExpandableTableInputProps {
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
}

/**
 * A text input designed for use inside narrow table cells.
 * At rest: fills its cell (compact).
 * On focus: expands to 260px using absolute positioning, overlapping adjacent
 *   cells without pushing layout, highlighted with shadow + primary ring.
 * On blur: shrinks back to full-width of its cell.
 */
export function ExpandableTableInput({
  value,
  onChange,
  placeholder,
  className,
  type = "text",
  min,
  max,
}: ExpandableTableInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    /* Relative wrapper reserves the cell height so the row doesn't collapse */
    <div className="relative h-8 w-full">
      {/* Invisible spacer keeps the cell width stable when input is absolute */}
      <div className="h-8 w-full pointer-events-none select-none" aria-hidden />

      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          // Base styles
          "absolute top-0 left-0 h-8 rounded-md border border-input bg-background",
          "px-3 py-1 text-xs ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none",
          // Smooth width + shadow transition
          "transition-[width,box-shadow,border-color] duration-200 ease-in-out",
          // Collapsed state
          !focused && "w-full z-0",
          // Expanded state — overlays adjacent cells
          focused &&
            "w-[260px] z-50 shadow-xl border-primary ring-2 ring-primary/20 bg-background",
          className
        )}
      />
    </div>
  );
}
