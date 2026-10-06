"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { QuestionOption } from "@/lib/types";

interface DropdownInputProps {
  options: QuestionOption[];
  value: string;
  onChange: (val: string) => void;
  onAutoAdvance?: () => void;
}

export function DropdownInput({
  options,
  value,
  onChange,
  onAutoAdvance,
}: DropdownInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (label: string) => {
    onChange(label);
    setIsOpen(false);
    if (onAutoAdvance) {
      setTimeout(onAutoAdvance, 220);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#E0E0E2] hover:bg-[#D4D2D6] rounded-[4px] border border-[#C5C3C8] text-left transition-colors cursor-pointer select-none"
      >
        <span
          className={`text-[17px] font-karla truncate ${
            value ? "text-[#2B2530] font-medium" : "text-[#6B6570]"
          }`}
        >
          {value || "Select an option..."}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#6B6570] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-13 w-full bg-white rounded-[8px] border border-[#E6E6E8] shadow-xl py-2 z-30 max-h-60 overflow-hidden flex flex-col animate-in fade-in-50 duration-100">
          {/* Search box if > 4 options */}
          {options.length > 4 && (
            <div className="px-3 pb-2 border-b border-[#F0EFF2] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#A8A3AD]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to filter options..."
                autoFocus
                className="w-full text-xs text-[#2B2530] placeholder-[#A8A3AD] focus:outline-hidden"
              />
            </div>
          )}

          {/* Options list */}
          <div className="overflow-y-auto flex-1 py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-[#A8A3AD] text-center">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.label;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.label)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left font-karla transition-colors ${
                      isSelected
                        ? "bg-[#F5F5F5] text-[#2B2530] font-semibold"
                        : "text-[#2B2530] hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#2B2530] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
