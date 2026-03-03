import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-focus-ring)] focus-visible:ring-offset-2 ring-offset-[var(--ring-offset)] disabled:pointer-events-none disabled:opacity-50 font-[family-name:var(--font-display)]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-bg)] text-[var(--text-on-accent)] hover:bg-[var(--accent-bg-hover)] shadow-[var(--shadow-sm)]",
        secondary:
          "bg-[var(--secondary-bg)] text-[var(--text-on-secondary)] hover:bg-[var(--secondary-bg-hover)] shadow-[var(--shadow-sm)]",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-[var(--shadow-sm)]",
        outline:
          "border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-sunken)] text-[var(--text-primary)] hover:text-[var(--text-primary)]",
        ghost:
          "hover:bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        link: "text-[var(--accent-text)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
