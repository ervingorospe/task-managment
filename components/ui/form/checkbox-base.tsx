"use client";

import { type ComponentProps, type ReactNode, forwardRef } from "react";

interface CheckboxBaseProps extends Omit<ComponentProps<"input">, "type"> {
  label?: ReactNode;
  description?: ReactNode;
  optional?: boolean;
  error?: string;
}

const CheckboxBase = forwardRef<HTMLInputElement, CheckboxBaseProps>(
  (
    { label, description, optional, error, disabled, className, ...props },
    ref,
  ) => {
    return (
      <div>
        <label
          className={[
            "flex items-center gap-2",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <input
            {...props}
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className={[
              "mt-0.5 h-4 w-4 rounded border-line",
              "accent-accent",
              "focus:ring-2 focus:ring-accent/20",
              error ? "border-danger" : "",
              className ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
          />

          {(label || description) && (
            <div className="space-y-0.5">
              {label && (
                <span className="text-sm text-ink">
                  {label}
                  {optional && (
                    <span className="ml-1 font-normal text-ink-faint">
                      (optional)
                    </span>
                  )}
                </span>
              )}
              {description && (
                <p className="text-xs text-ink-muted">{description}</p>
              )}
            </div>
          )}
        </label>

        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);

CheckboxBase.displayName = "CheckboxBase";

export default CheckboxBase;
