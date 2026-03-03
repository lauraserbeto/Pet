import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-[family-name:var(--font-display)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-primary-100)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-200)]",
        secondary:
          "border-transparent bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)] hover:bg-[var(--color-secondary-200)]",
        destructive:
          "border-transparent bg-red-100 text-red-700 hover:bg-red-200",
        outline: "text-slate-700 border-slate-200",
        success: "border-transparent bg-green-100 text-green-700 hover:bg-green-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
