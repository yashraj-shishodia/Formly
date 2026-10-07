"use client";

import React, { useEffect, useCallback } from "react";

interface YesNoInputProps {
  value: boolean | string | null;
  onChange: (val: boolean) => void;
  onAutoAdvance?: () => void;
}

export function YesNoInput({
  value,
  onChange,
  onAutoAdvance,
}: YesNoInputProps) {
  const currentBool =
    typeof value === "boolean"
      ? value
      : typeof value === "string"
      ? value.toLowerCase() === "yes" || value.toLowerCase() === "true"
      : null;

  const handleSelect = useCallback(
    (val: boolean) => {
      onChange(val);
      if (onAutoAdvance) {
        setTimeout(onAutoAdvance, 220);
      }
    },
    [onChange, onAutoAdvance]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleSelect(true);
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleSelect(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSelect]);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Yes option */}
      <button
        type="button"
        onClick={() => handleSelect(true)}
        style={
          currentBool === true
            ? {
                borderColor: "var(--form-button, #2B2530)",
                color: "var(--form-text, #2B2530)",
              }
            : {
                color: "var(--form-text, #2B2530)",
              }
        }
        className={`flex items-center gap-3.5 px-4 py-3 min-h-[48px] min-w-[240px] max-w-[340px] w-fit rounded-[4px] text-left transition-all select-none cursor-pointer ${
          currentBool === true
            ? "bg-white border-2 shadow-xs"
            : "bg-[#E0E0E2] hover:bg-[#D4D2D6] border-2 border-transparent"
        }`}
      >
        <div
          style={
            currentBool === true
              ? {
                  backgroundColor: "var(--form-button, #2B2530)",
                  color: "var(--form-button-text, #FFFFFF)",
                }
              : {
                  color: "var(--form-text, #2B2530)",
                }
          }
          className={`w-7 h-7 rounded-[3px] flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
            currentBool === true ? "" : "border border-[#8E8A93] bg-transparent"
          }`}
        >
          Y
        </div>
        <span
          style={{
            color: "var(--form-text, #2B2530)",
            fontFamily: "var(--form-font, var(--font-karla))",
          }}
          className="text-[17px] font-normal leading-normal pr-2"
        >
          Yes
        </span>
      </button>

      {/* No option */}
      <button
        type="button"
        onClick={() => handleSelect(false)}
        style={
          currentBool === false
            ? {
                borderColor: "var(--form-button, #2B2530)",
                color: "var(--form-text, #2B2530)",
              }
            : {
                color: "var(--form-text, #2B2530)",
              }
        }
        className={`flex items-center gap-3.5 px-4 py-3 min-h-[48px] min-w-[240px] max-w-[340px] w-fit rounded-[4px] text-left transition-all select-none cursor-pointer ${
          currentBool === false
            ? "bg-white border-2 shadow-xs"
            : "bg-[#E0E0E2] hover:bg-[#D4D2D6] border-2 border-transparent"
        }`}
      >
        <div
          style={
            currentBool === false
              ? {
                  backgroundColor: "var(--form-button, #2B2530)",
                  color: "var(--form-button-text, #FFFFFF)",
                }
              : {
                  color: "var(--form-text, #2B2530)",
                }
          }
          className={`w-7 h-7 rounded-[3px] flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
            currentBool === false ? "" : "border border-[#8E8A93] bg-transparent"
          }`}
        >
          N
        </div>
        <span
          style={{
            color: "var(--form-text, #2B2530)",
            fontFamily: "var(--form-font, var(--font-karla))",
          }}
          className="text-[17px] font-normal leading-normal pr-2"
        >
          No
        </span>
      </button>
    </div>
  );
}
