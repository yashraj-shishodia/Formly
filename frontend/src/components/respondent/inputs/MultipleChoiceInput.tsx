"use client";

import React, { useEffect, useCallback } from "react";
import { Check } from "lucide-react";
import { QuestionOption } from "@/lib/types";

interface MultipleChoiceInputProps {
  options: QuestionOption[];
  value: string | string[];
  onChange: (val: string | string[]) => void;
  onAutoAdvance?: () => void;
  isMultiSelect?: boolean;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function MultipleChoiceInput({
  options,
  value,
  onChange,
  onAutoAdvance,
  isMultiSelect = false,
}: MultipleChoiceInputProps) {
  const selectedValues = Array.isArray(value)
    ? value
    : value
    ? [String(value)]
    : [];

  const handleSelect = useCallback(
    (label: string) => {
      if (isMultiSelect) {
        if (selectedValues.includes(label)) {
          onChange(selectedValues.filter((v) => v !== label));
        } else {
          onChange([...selectedValues, label]);
        }
      } else {
        onChange(label);
        if (onAutoAdvance) {
          setTimeout(onAutoAdvance, 220);
        }
      }
    },
    [isMultiSelect, selectedValues, onChange, onAutoAdvance]
  );

  // Keyboard shortcut listener (A, B, C...)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is in an active input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const key = e.key.toUpperCase();
      const index = LETTERS.indexOf(key);
      if (index >= 0 && index < options.length) {
        e.preventDefault();
        handleSelect(options[index].label);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, handleSelect]);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {options.map((option, idx) => {
        const isSelected = selectedValues.includes(option.label);
        const letter = LETTERS[idx] || `${idx + 1}`;

        return (
          <button
            key={option.id ?? idx}
            type="button"
            onClick={() => handleSelect(option.label)}
            style={
              isSelected
                ? {
                    borderColor: "var(--form-button, #2B2530)",
                    color: "var(--form-text, #2B2530)",
                  }
                : {
                    color: "var(--form-text, #2B2530)",
                  }
            }
            className={`flex items-center gap-3.5 px-4 py-3 min-h-[48px] min-w-[240px] max-w-[440px] w-fit rounded-[4px] text-left transition-all select-none cursor-pointer ${
              isSelected
                ? "bg-white border-2 shadow-xs"
                : "bg-[#E0E0E2] hover:bg-[#D4D2D6] border-2 border-transparent"
            }`}
          >
            {/* Letter badge: outlined when idle, filled button color when selected */}
            <div
              style={
                isSelected
                  ? {
                      backgroundColor: "var(--form-button, #2B2530)",
                      color: "var(--form-button-text, #FFFFFF)",
                    }
                  : {
                      color: "var(--form-text, #2B2530)",
                    }
              }
              className={`w-7 h-7 rounded-[3px] flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                isSelected ? "" : "border border-[#8E8A93] bg-transparent"
              }`}
            >
              {isSelected && isMultiSelect ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                letter
              )}
            </div>

            {/* Option Label */}
            <span
              style={{
                color: "var(--form-text, #2B2530)",
                fontFamily: "var(--form-font, var(--font-karla))",
              }}
              className="text-[17px] font-normal leading-normal pr-2"
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
