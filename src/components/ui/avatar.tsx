import * as React from "react";
import { cn } from "../../lib/utils";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--bg-sunken)]",
          className
        )}
        {...props}
      >
        {src && !hasError ? (
           <ImageWithFallback
           src={src}
           alt={alt || "Avatar"}
           className="aspect-square h-full w-full object-cover"
           // Simple error handling by hiding if it fails, showing fallback
           // Note: ImageWithFallback handles its own fallback, but for avatar semantics we might want initials
         />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--bg-sunken)] text-[var(--text-muted)] font-bold font-[family-name:var(--font-display)]">
            {fallback || "??"}
          </div>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };