"use client";

import React, { useRef, useEffect } from "react";

interface LongTextInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function LongTextInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Type your answer here...",
  autoFocus = true,
}: LongTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="w-full max-w-xl space-y-2">
      <textarea
        ref={textareaRef}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        style={{
          borderBottomColor: "var(--form-button, #D4D2D6)",
          color: "var(--form-text, #2B2530)",
          fontFamily: "var(--form-font, var(--font-karla))",
        }}
        className="w-full bg-transparent border-b-2 text-lg md:text-xl placeholder-[#A8A3AD] py-2 focus:outline-hidden transition-colors resize-none leading-relaxed"
      />
      <div className="text-[11px] text-[#A8A3AD]">
        Shift + Enter to make a new line
      </div>
    </div>
  );
}
