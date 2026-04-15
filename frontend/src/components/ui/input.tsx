import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1 overflow-visible">
        {label && <label className="text-sm font-medium text-slate-700 font-[family-name:var(--font-display)]">{label}</label>}
        <input
          type={type}
          className={cn(
            // Base layout
            "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm",
            // File input resets
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            // Placeholder
            "placeholder:text-slate-400",
            // Focus — use outline instead of ring to avoid clipping from parent overflow
            "outline-none transition-[border-color,box-shadow] duration-150",
            "focus:border-[var(--color-primary-400)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary-500)_20%,transparent)]",
            // Disabled
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
