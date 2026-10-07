"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "full";
}

export function ThemeToggle({ className = "", variant = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex items-center justify-center rounded-[8px] transition-colors cursor-pointer select-none border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${
        variant === "full" ? "px-3 py-2 w-full gap-2 text-xs font-medium" : "w-8 h-8"
      } ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          {variant === "full" && <span>Light Mode</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
          {variant === "full" && <span>Dark Mode</span>}
        </>
      )}
    </button>
  );
}
