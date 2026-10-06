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
        <h1 className="text-3xl md:text-4xl font-normal text-[#2B2530] tracking-tight font-karla leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-base md:text-lg text-[#6B6570] font-karla leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        )}
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onStart}
          className="text-lg font-medium px-8 py-3.5 rounded-[8px] bg-[#2B2530] hover:bg-[#3A3340] text-white shadow-xs"
        >
          {buttonText}
        </Button>

        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[#6B6570] select-none">
          press <strong className="font-semibold text-[#2B2530]">Enter</strong>
          <CornerDownLeft className="w-3.5 h-3.5 text-[#6B6570]" />
        </span>
      </div>
    </div>
  );
}
