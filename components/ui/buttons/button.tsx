import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

//text-white
const variantStyles: Record<Variant, string> = {
  // #00FA9A is bright enough that white text fails contrast — dark ink text instead.
  // Hover shade (#00C278) is dark enough to take white text.
  primary:
    "bg-accent text-ink font-semibold hover:bg-accent-hover hover:text-white",
  secondary: "bg-surface text-ink border border-line hover:bg-canvas",
  ghost: "text-ink-muted hover:text-ink hover:bg-canvas",
  danger: "bg-danger text-white hover:opacity-90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium",
          "transition-colors duration-200 ease-in-out",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
