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
      setTheme((prev) => (prev === currentTheme ? prev : currentTheme));
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
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">
            Respondent Font
          </label>
          <select
            value={theme.font}
            onChange={(e) => setTheme({ ...theme, font: e.target.value })}
            className="w-full bg-[var(--surface-page)] border border-[var(--border)] rounded-[8px] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--primary)]"
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
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
            Color Palette
          </label>

          {/* Background Color */}
          <div className="flex items-center justify-between p-2.5 bg-[var(--surface-card)] rounded-[8px] border border-[var(--border)]">
            <span className="text-xs text-[var(--text-primary)] font-medium">
              Background Color
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.background_color}
                onChange={(e) =>
                  setTheme({ ...theme, background_color: e.target.value })
                }
                className="w-7 h-7 rounded-[4px] cursor-pointer border border-[var(--border-strong)]"
              />
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {theme.background_color}
              </span>
            </div>
          </div>

          {/* Text Color */}
          <div className="flex items-center justify-between p-2.5 bg-[var(--surface-card)] rounded-[8px] border border-[var(--border)]">
            <span className="text-xs text-[var(--text-primary)] font-medium">Text Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.text_color}
                onChange={(e) =>
                  setTheme({ ...theme, text_color: e.target.value })
                }
                className="w-7 h-7 rounded-[4px] cursor-pointer border border-[var(--border-strong)]"
              />
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {theme.text_color}
              </span>
            </div>
          </div>

          {/* Button Color */}
          <div className="flex items-center justify-between p-2.5 bg-[var(--surface-card)] rounded-[8px] border border-[var(--border)]">
            <span className="text-xs text-[var(--text-primary)] font-medium">
              Primary Button Color
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.button_color}
                onChange={(e) =>
                  setTheme({ ...theme, button_color: e.target.value })
                }
                className="w-7 h-7 rounded-[4px] cursor-pointer border border-[var(--border-strong)]"
              />
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {theme.button_color}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border)]">
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
