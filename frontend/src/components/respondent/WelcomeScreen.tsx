"use client";

import React, { useEffect } from "react";
import { CornerDownLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WelcomeScreenProps {
  title: string;
  description?: string | null;
  buttonText?: string;
  onStart: () => void;
}

export function WelcomeScreen({
  title,
  description,
  buttonText = "Start",
  onStart,
}: WelcomeScreenProps) {
  // Listen for Enter key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        onStart();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onStart]);

  return (
    <div className="w-full max-w-xl mx-auto text-center flex flex-col items-center justify-center space-y-6 py-8 px-4">
      <div className="w-12 h-12 rounded-full bg-white border border-[#E6E6E8] flex items-center justify-center text-[#2B2530] shadow-2xs">
        <Sparkles className="w-6 h-6 text-[#8E4FC0]" />
      </div>

      <div className="space-y-3">
        <h1
          className="text-3xl md:text-4xl font-normal tracking-tight leading-tight"
          style={{
            color: "var(--form-text, #2B2530)",
            fontFamily: "var(--form-font, var(--font-karla))",
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="text-base md:text-lg leading-relaxed max-w-md mx-auto"
            style={{
              color: "var(--form-text, #2B2530)",
              opacity: 0.75,
              fontFamily: "var(--form-font, var(--font-karla))",
            }}
          >
            {description}
          </p>
        )}
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onStart}
          style={{
            backgroundColor: "var(--form-button, #2B2530)",
            color: "var(--form-button-text, #FFFFFF)",
          }}
          className="text-lg font-medium px-8 py-3.5 rounded-[8px] hover:opacity-90 transition-opacity shadow-xs border-0"
        >
          {buttonText}
        </Button>

        <span
          className="hidden sm:inline-flex items-center gap-1 text-xs select-none"
          style={{ color: "var(--form-text, #2B2530)", opacity: 0.7 }}
        >
          press <strong className="font-semibold">Enter</strong>
          <CornerDownLeft className="w-3.5 h-3.5 opacity-80" />
        </span>
      </div>
    </div>
  );
}
