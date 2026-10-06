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

  // Keyboard shortcut for 1..9
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const num = parseInt(e.key, 10);
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
              className={`group flex flex-col items-center justify-center w-14 h-16 rounded-[8px] transition-all cursor-pointer ${
                isDirectlySelected
                  ? "bg-white border-2 border-[#2B2530] shadow-xs"
                  : isHovered
                  ? "bg-[#D8D8DC] border-2 border-transparent"
                  : "bg-[#E0E0E2] hover:bg-[#D4D2D6] border-2 border-transparent"
              }`}
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  isHovered || isSelected
                    ? "fill-[#2B2530] text-[#2B2530]"
                    : "text-[#8E8A93]"
                }`}
              />
              <span className="text-xs font-bold text-[#2B2530] mt-1 select-none">
                {num}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between max-w-sm text-xs text-[#6B6570] font-karla">
        <span>1 = Lowest</span>
        <span>{maxRating} = Highest</span>
      </div>
    </div>
  );
}
