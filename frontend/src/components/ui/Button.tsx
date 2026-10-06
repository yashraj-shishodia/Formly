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
    "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2B2530] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-[13px] rounded-[8px] gap-1.5",
    md: "px-5 py-2.5 text-[15px] rounded-[8px] gap-2",
    lg: "px-7 py-3 text-[18px] rounded-[8px] gap-2.5",
  };

  const variantStyles = {
    primary: "bg-[#2B2530] text-white hover:bg-[#3A3340] active:scale-[0.99]",
    publish: "bg-[#2F7D69] text-white hover:bg-[#286B5A] active:scale-[0.99]",
    secondary: "bg-[#F5F5F5] text-[#2B2530] hover:bg-[#EAEAEC] active:scale-[0.99]",
    outline: "border border-[#E6E6E8] text-[#2B2530] bg-white hover:bg-[#F5F5F5]",
    danger: "bg-[#E53E3E] text-white hover:bg-[#C53030] active:scale-[0.99]",
    ghost: "text-[#6B6570] hover:text-[#2B2530] hover:bg-[#F5F5F5]",
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
