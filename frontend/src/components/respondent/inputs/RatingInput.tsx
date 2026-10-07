"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";

interface RatingInputProps {
  value: number | string | null;
  onChange: (val: number) => void;
  onAutoAdvance?: () => void;
  maxRating?: number;
}

export function RatingInput({
  value,
  onChange,
  onAutoAdvance,
  maxRating = 5,
}: RatingInputProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const currentRating = typeof value === "number" ? value : Number(value) || null;

  const handleSelect = useCallback(
    (rating: number) => {
      onChange(rating);
      if (onAutoAdvance) {
        setTimeout(onAutoAdvance, 220);
      }
    },
    [onChange, onAutoAdvance]
  );

  // Keyboard shortcut for 1..9 and 0 for 10
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      let num = parseInt(e.key, 10);
      if (e.key === "0" && maxRating >= 10) {
        num = 10;
      }
      if (!isNaN(num) && num >= 1 && num <= maxRating) {
        e.preventDefault();
        handleSelect(num);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [maxRating, handleSelect]);

  const items = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        {items.map((num) => {
          const isSelected = currentRating !== null && currentRating >= num;
          const isHovered = hoverRating !== null && hoverRating >= num;
          const isDirectlySelected = currentRating === num;

          return (
            <button
              key={num}
              type="button"
              onClick={() => handleSelect(num)}
              onMouseEnter={() => setHoverRating(num)}
              onMouseLeave={() => setHoverRating(null)}
              style={
                isDirectlySelected
                  ? { borderColor: "var(--form-button, #2B2530)" }
                  : {}
              }
              className={`group flex flex-col items-center justify-center w-14 h-16 rounded-[8px] transition-all cursor-pointer ${
                isDirectlySelected
                  ? "bg-white border-2 shadow-xs"
                  : isHovered
                  ? "bg-[#D8D8DC] border-2 border-transparent"
                  : "bg-[#E0E0E2] hover:bg-[#D4D2D6] border-2 border-transparent"
              }`}
            >
              <Star
                style={
                  isHovered || isSelected
                    ? {
                        fill: "var(--form-button, #2B2530)",
                        color: "var(--form-button, #2B2530)",
                      }
                    : { color: "#8E8A93" }
                }
                className="w-6 h-6 transition-colors"
              />
              <span
                style={{ color: "var(--form-text, #2B2530)" }}
                className="text-xs font-bold mt-1 select-none"
              >
                {num}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          color: "var(--form-text, #2B2530)",
          opacity: 0.7,
          fontFamily: "var(--form-font, var(--font-karla))",
        }}
        className="flex items-center justify-between max-w-sm text-xs"
      >
        <span>1 = Lowest</span>
        <span>{maxRating} = Highest</span>
      </div>
    </div>
  );
}
