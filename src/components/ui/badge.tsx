import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)] focus:ring-offset-2 font-[family-name:var(--font-display)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--accent-bg-subtle)] text-[var(--accent-text)] hover:bg-[var(--color-primary-200)] dark:hover:bg-[var(--accent-bg-subtle)]",
        secondary:
          "border-transparent bg-[var(--secondary-bg-subtle)] text-[var(--secondary-text)] hover:bg-[var(--color-secondary-200)] dark:hover:bg-[var(--secondary-bg-subtle)]",
        destructive:
          "border-transparent bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400",
        outline:
          "text-[var(--text-secondary)] border-[var(--border-default)]",
        success:
          "border-transparent bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400",
        subtle:
          "border-transparent bg-[var(--badge-subtle-bg)] text-[var(--badge-subtle-text)]",
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
