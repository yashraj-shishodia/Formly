"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ThemeConfig } from "@/lib/types";
import { ALLOWED_FONT_LIST } from "@/lib/tokens";

interface DesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: ThemeConfig;
  onSaveTheme: (theme: ThemeConfig) => void;
}

const DEFAULT_THEME: ThemeConfig = {
  font: "Karla",
  background_color: "#FFFFFF",
  text_color: "#2B2530",
  button_color: "#2B2530",
  button_text_color: "#FFFFFF",
};

export function DesignModal({
  isOpen,
  onClose,
  currentTheme,
  onSaveTheme,
}: DesignModalProps) {
  const [theme, setTheme] = useState<ThemeConfig>(currentTheme || DEFAULT_THEME);

  useEffect(() => {
    if (currentTheme) {
      setTheme(currentTheme);
    }
  }, [currentTheme]);

  const handleSave = () => {
    onSaveTheme(theme);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Design & Theme Settings"
      description="Customize the typography and colors for this form."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-2">
        {/* Font Selection */}
        <div>
          <label className="text-xs font-semibold text-[#6B6570] uppercase tracking-wider block mb-1.5">
            Respondent Font
          </label>
          <select
            value={theme.font}
            onChange={(e) => setTheme({ ...theme, font: e.target.value })}
            className="w-full bg-white border border-[#E6E6E8] rounded-[8px] px-3 py-2 text-sm text-[#2B2530] focus:outline-hidden focus:border-[#2B2530]"
          >
            {ALLOWED_FONT_LIST.map((f) => (
              <option key={f.name} value={f.name}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Color Palette */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#6B6570] uppercase tracking-wider block">
            Color Palette
          </label>

          {/* Background Color */}
          <div className="flex items-center justify-between p-2.5 bg-[#F5F5F5] rounded-[8px] border border-[#E6E6E8]">
            <span className="text-xs text-[#2B2530] font-medium">
              Background Color
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.background_color}
                onChange={(e) =>
                  setTheme({ ...theme, background_color: e.target.value })
                }
                className="w-7 h-7 rounded-[4px] cursor-pointer border border-[#D4D2D6]"
              />
              <span className="text-xs font-mono text-[#6B6570]">
                {theme.background_color}
              </span>
            </div>
          </div>

          {/* Text Color */}
          <div className="flex items-center justify-between p-2.5 bg-[#F5F5F5] rounded-[8px] border border-[#E6E6E8]">
            <span className="text-xs text-[#2B2530] font-medium">Text Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.text_color}
                onChange={(e) =>
                  setTheme({ ...theme, text_color: e.target.value })
                }
                className="w-7 h-7 rounded-[4px] cursor-pointer border border-[#D4D2D6]"
              />
              <span className="text-xs font-mono text-[#6B6570]">
                {theme.text_color}
              </span>
            </div>
          </div>

          {/* Button Color */}
          <div className="flex items-center justify-between p-2.5 bg-[#F5F5F5] rounded-[8px] border border-[#E6E6E8]">
            <span className="text-xs text-[#2B2530] font-medium">
              Primary Button Color
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.button_color}
                onChange={(e) =>
                  setTheme({ ...theme, button_color: e.target.value })
                }
                className="w-7 h-7 rounded-[4px] cursor-pointer border border-[#D4D2D6]"
              />
              <span className="text-xs font-mono text-[#6B6570]">
                {theme.button_color}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E6E6E8]">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            Apply Design
          </Button>
        </div>
      </div>
    </Modal>
  );
}
