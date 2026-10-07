"use client";

import React, { useRef, useEffect } from "react";

interface EmailInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function EmailInput({
  value,
  onChange,
  onSubmit,
  placeholder = "name@example.com",
  autoFocus = true,
}: EmailInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="w-full max-w-xl">
      <input
        ref={inputRef}
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
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
        className="w-full bg-transparent border-b-2 text-xl md:text-2xl placeholder-[#A8A3AD] py-2.5 focus:outline-hidden transition-colors"
      />
    </div>
  );
}
