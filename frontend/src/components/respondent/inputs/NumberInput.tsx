"use client";

import React, { useRef, useEffect } from "react";

interface NumberInputProps {
  value: number | string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function NumberInput({
  value,
  onChange,
  onSubmit,
  placeholder = "0",
  autoFocus = true,
}: NumberInputProps) {
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
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        className="w-full bg-transparent border-b-2 border-[#D4D2D6] focus:border-[#2B2530] text-xl md:text-2xl text-[#2B2530] placeholder-[#A8A3AD] py-2.5 focus:outline-hidden transition-colors font-karla"
      />
    </div>
  );
}
