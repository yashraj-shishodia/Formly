"use client";

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "publish" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-[13px] rounded-[8px] gap-1.5",
    md: "px-5 py-2.5 text-[15px] rounded-[8px] gap-2",
    lg: "px-7 py-3 text-[18px] rounded-[8px] gap-2.5",
  };

  const variantStyles = {
    primary: "bg-[var(--primary)] text-[var(--surface-page)] hover:opacity-90 active:scale-[0.99]",
    publish: "bg-[var(--accent-publish)] text-white hover:opacity-90 active:scale-[0.99]",
    secondary: "bg-[var(--surface-card)] text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] border border-[var(--border)] active:scale-[0.99]",
    outline: "border border-[var(--border)] text-[var(--text-primary)] bg-[var(--surface-page)] hover:bg-[var(--surface-card)]",
    danger: "bg-[var(--accent-error)] text-white hover:opacity-90 active:scale-[0.99]",
    ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)]",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
