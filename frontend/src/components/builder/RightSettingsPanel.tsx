"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  HelpCircle,
  Type,
  AlignLeft,
  ListFilter,
  ChevronDownSquare,
  ToggleLeft,
  Mail,
  Hash,
  Star,
} from "lucide-react";
import { Question, QuestionType } from "@/lib/types";
import { toast } from "sonner";

interface RightSettingsPanelProps {
  question: Question | null;
  onUpdateQuestion: (fields: Partial<Question>) => void;
  onUpdateOptions: (options: Array<{ label: string; position: number }>) => void;
  onChangeType: (type: QuestionType) => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, { label: string; icon: React.ElementType }> = {
  short_text: { label: "Short Text", icon: Type },
  long_text: { label: "Long Text", icon: AlignLeft },
  multiple_choice: { label: "Multiple Choice", icon: ListFilter },
  dropdown: { label: "Dropdown", icon: ChevronDownSquare },
  yes_no: { label: "Yes / No", icon: ToggleLeft },
  email: { label: "Email", icon: Mail },
  number: { label: "Number", icon: Hash },
  rating: { label: "Rating", icon: Star },
};

export function RightSettingsPanel({
  question,
  onUpdateQuestion,
  onUpdateOptions,
  onChangeType,
}: RightSettingsPanelProps) {
  const [segmentedTab, setSegmentedTab] = useState<"text" | "video">("text");

  if (!question) {
    return (
      <div className="w-full lg:w-[300px] shrink-0 p-4 bg-[var(--surface-card)] rounded-[16px] border border-[var(--border)] text-xs text-[var(--text-secondary)] text-center">
        Select a question to customize its properties.
      </div>
    );
  }

  // Parse settings_json
  let settings: Record<string, unknown> = {};
  if (question.settings_json) {
    try {
      settings = JSON.parse(question.settings_json);
    } catch {
      settings = {};
    }
  }

  const updateSetting = (key: string, value: unknown) => {
    const updated = { ...settings, [key]: value };
    onUpdateQuestion({ settings_json: JSON.stringify(updated) });
  };

  // Option handlers for choice / dropdown
  const handleOptionChange = (idx: number, newLabel: string) => {
    const updated = question.options.map((opt, i) =>
      i === idx ? { ...opt, label: newLabel } : opt
    );
    onUpdateOptions(
      updated.map((o, i) => ({ label: o.label, position: i }))
    );
  };

  const handleAddOption = () => {
    const newIdx = question.options.length + 1;
    const updated = [
      ...question.options,
      { label: `Option ${newIdx}`, position: question.options.length },
    ];
    onUpdateOptions(
      updated.map((o, i) => ({ label: o.label, position: i }))
    );
  };

  const handleRemoveOption = (idx: number) => {
    if (question.options.length <= 1) {
      toast.error("Multiple choice must have at least one option");
      return;
    }
    const updated = question.options.filter((_, i) => i !== idx);
    onUpdateOptions(
      updated.map((o, i) => ({ label: o.label, position: i }))
    );
  };

  return (
    <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-3.5 select-none overflow-y-auto pr-1">
      {/* Card 1: Question Segmented Control per DESIGN_SPEC §3 */}
      <div className="bg-[var(--surface-card)] rounded-[16px] border border-[var(--border)] p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
          <span>Question</span>
          <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </div>

        {/* Segmented Control Text | Video */}
        <div className="flex p-1 bg-[var(--surface-canvas)] rounded-[10px] text-xs font-medium">
          <button
            type="button"
            onClick={() => setSegmentedTab("text")}
            className={`flex-1 py-1.5 rounded-[8px] transition-all text-center ${
              segmentedTab === "text"
                ? "bg-[var(--surface-page)] text-[var(--text-primary)] shadow-xs font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => toast.info("Video questions are a placeholder (Coming Soon)")}
            className={`flex-1 py-1.5 rounded-[8px] transition-all text-center flex items-center justify-center gap-1 text-[var(--text-muted)]`}
          >
            <span>Video</span>
            <span className="text-[9px] text-[#2F7D69] bg-[#E6F4EA] px-1 py-0.5 rounded-[3px]">
              Soon
            </span>
          </button>
        </div>
      </div>

      {/* Card 2: Answer & Type Settings */}
      <div className="bg-[var(--surface-card)] rounded-[16px] border border-[var(--border)] p-3.5 space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
          <span>Answer</span>
        </div>

        {/* Change Question Type Dropdown */}
        <div className="relative">
          <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">
            Question Type
          </label>
          <div className="relative">
            <select
              value={question.type}
              onChange={(e) => onChangeType(e.target.value as QuestionType)}
              className="w-full appearance-none bg-[var(--surface-page)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-xs text-[var(--text-primary)] font-medium focus:outline-hidden focus:border-[var(--primary)] cursor-pointer"
            >
              {Object.entries(QUESTION_TYPE_LABELS).map(([t, info]) => (
                <option key={t} value={t}>
                  {info.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Toggle 1: Required */}
        <div className="flex items-center justify-between py-1 border-t border-[var(--border)]">
          <div>
            <span className="text-xs font-medium text-[var(--text-primary)] block">
              Required
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Respondents cannot skip
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={question.required}
            onClick={() => onUpdateQuestion({ required: !question.required })}
            className={`w-9 h-5 rounded-full transition-colors relative focus:outline-hidden ${
              question.required ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]"
            }`}
          >
            <span
              className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                question.required ? "left-4.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Type-Specific: Choices Editor for Multiple Choice & Dropdown */}
        {(question.type === "multiple_choice" || question.type === "dropdown") && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)]">Choices</span>
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-primary)] hover:text-[#8E4FC0]"
              >
                <Plus className="w-3 h-3" />
                <span>Add choice</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {question.options.map((opt, idx) => (
                <div key={opt.id ?? idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 bg-[var(--surface-page)] border border-[var(--border)] rounded-[6px] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-error)] transition-colors"
                    title="Remove choice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Multiple Choice: Allow multiple selection */}
            {question.type === "multiple_choice" && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  Allow multiple selection
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!settings.allow_multiple}
                  onClick={() =>
                    updateSetting("allow_multiple", !settings.allow_multiple)
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative focus:outline-hidden ${
                    settings.allow_multiple ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                      settings.allow_multiple ? "left-4.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Type-Specific: Rating steps */}
        {question.type === "rating" && (
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="text-xs font-medium text-[var(--text-primary)] block">
              Max Rating Steps
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[3, 5, 7, 10].map((steps) => (
                <button
                  key={steps}
                  type="button"
                  onClick={() => updateSetting("max_rating", steps)}
                  className={`py-1.5 rounded-[6px] text-xs font-medium border transition-colors ${
                    (settings.max_rating || 5) === steps
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-[var(--surface-page)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-card-hover)]"
                  }`}
                >
                  {steps}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type-Specific: Number min / max */}
        {question.type === "number" && (
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <span className="text-xs font-medium text-[var(--text-primary)] block">
              Number Constraints
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">
                  Min value
                </label>
                <input
                  type="number"
                  value={settings.min_value !== undefined ? String(settings.min_value) : ""}
                  onChange={(e) =>
                    updateSetting(
                      "min_value",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="None"
                  className="w-full bg-[var(--surface-page)] border border-[var(--border)] rounded-[6px] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">
                  Max value
                </label>
                <input
                  type="number"
                  value={settings.max_value !== undefined ? String(settings.max_value) : ""}
                  onChange={(e) =>
                    updateSetting(
                      "max_value",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="None"
                  className="w-full bg-[var(--surface-page)] border border-[var(--border)] rounded-[6px] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Type-Specific: Short text / Long text max length */}
        {(question.type === "short_text" || question.type === "long_text") && (
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="text-xs font-medium text-[var(--text-primary)] block">
              Max Characters
            </label>
            <input
              type="number"
              value={settings.max_length !== undefined ? String(settings.max_length) : ""}
              onChange={(e) =>
                updateSetting(
                  "max_length",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder={question.type === "short_text" ? "255" : "5000"}
              className="w-full bg-[var(--surface-page)] border border-[var(--border)] rounded-[6px] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* Card 3: Logic Card (placeholder) */}
      <div className="bg-[var(--surface-card)] rounded-[16px] border border-[var(--border)] p-3.5 flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
        <div className="flex items-center gap-2">
          <span>Logic Jumps</span>
          <span className="text-[10px] text-[#2F7D69] bg-[#E6F4EA] px-1 py-0.5 rounded-[4px]">
            Soon
          </span>
        </div>
        <button
          type="button"
          onClick={() => toast.info("Logic branching and jump rules (Phase 6 bonus)")}
          className="w-5 h-5 rounded-[4px] border border-[var(--border-strong)] hover:bg-[var(--surface-page)] flex items-center justify-center text-[var(--text-secondary)]"
          title="Add logic rule"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
