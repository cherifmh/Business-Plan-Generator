import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary — midnight navy with 3D press effect (Stripe-style)
        default:
          "bg-primary text-primary-foreground font-semibold shadow-[0_2px_0_hsl(220_55%_5%)] hover:bg-primary/90 hover:shadow-[0_1px_0_hsl(220_55%_5%)] hover:translate-y-px active:shadow-none active:translate-y-0.5",
        // Destructive
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        // Outline — clean border
        outline:
          "border border-input bg-background hover:bg-accent/10 hover:text-accent-foreground hover:border-accent/40 shadow-sm",
        // Secondary — sovereign olive
        secondary:
          "bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/85 shadow-sm",
        // Ghost
        ghost: "hover:bg-foreground/[0.06] hover:text-foreground",
        // Link
        link: "text-primary underline-offset-4 hover:underline",
        // Gold accent variant
        gold:
          "font-semibold shadow-sm hover:opacity-90"
          + " [background:hsl(38_85%_52%)] [color:hsl(220_55%_10%)]"
          + " hover:[background:hsl(38_75%_60%)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
