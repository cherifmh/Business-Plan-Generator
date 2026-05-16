import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { getArabicTranslation } from "@/utils/translations";

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, children, ...props }, ref) => {
  let translation: string | undefined;
  let text = children;

  if (typeof children === 'string') {
    if (children.includes(' / ')) {
      const parts = children.split(' / ');
      text = parts[0];
      translation = parts[1];
    } else {
      translation = getArabicTranslation(children);
    }
  }

  if (typeof text === 'string' && translation) {
      return (
        <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), "flex items-center gap-2", className)} {...props}>
            {text}
            <span className="group relative flex items-center cursor-help">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 hover:bg-primary/20 transition-colors">ع</span>
                <span className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute bottom-full mb-1 left-0 w-max max-w-[250px] whitespace-normal bg-slate-800 text-white text-xs rounded py-1 px-2 shadow-lg transition-all z-50 pointer-events-none" dir="rtl">
                    {translation}
                </span>
            </span>
        </LabelPrimitive.Root>
      );
  }
  
  return (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props}>
        {children}
    </LabelPrimitive.Root>
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
