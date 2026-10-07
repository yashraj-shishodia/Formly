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
  Upload,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import { Question, QuestionType, LogicOperator } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { ALLOWED_OPERATORS_BY_TYPE, LOGIC_SUPPORTED_TYPES } from "@/lib/logic";
import { toast } from "sonner";

interface RightSettingsPanelProps {
  question: Question | null;
  allQuestions?: Question[];
  onUpdateQuestion: (fields: Partial<Question>) => void;
  onUpdateOptions: (options: Array<{ label: string; position: number }>) => void;
  onChangeType: (type: QuestionType) => void;
  onRefreshForm?: () => void;
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
  file_upload: { label: "File Upload", icon: Upload },
};

export function RightSettingsPanel({
  question,
  allQuestions = [],
  onUpdateQuestion,
  onUpdateOptions,
  onChangeType,
  onRefreshForm,
}: RightSettingsPanelProps) {
  const [segmentedTab, setSegmentedTab] = useState<"text" | "video">("text");

  // Logic jumps state
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [ruleOperator, setRuleOperator] = useState<LogicOperator>("equals");
  const [ruleValue, setRuleValue] = useState("");
  const [targetQuestionId, setTargetQuestionId] = useState<number | null>(null);
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<number | null>(null);

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

  // Logic rules helpers
  const isLogicSupported = LOGIC_SUPPORTED_TYPES.has(question.type);
  const availableOperators = ALLOWED_OPERATORS_BY_TYPE[question.type] || [];
  const subsequentQuestions = (allQuestions || []).filter(
    (q) => q.position > question.position
  );

  const initComposer = () => {
    if (availableOperators.length > 0) {
      setRuleOperator(availableOperators[0].value);
    }
    if (question.type === "multiple_choice" || question.type === "dropdown") {
      setRuleValue(question.options[0]?.label || "");
    } else if (question.type === "yes_no") {
      setRuleValue("true");
    } else if (question.type === "number" || question.type === "rating") {
      setRuleValue("1");
    } else {
      setRuleValue("");
    }
    setTargetQuestionId(subsequentQuestions[0]?.id ?? null);
    setIsAddingRule(true);
  };

  const handleCreateRule = async () => {
    if (!ruleValue.trim()) {
      toast.error("Please provide a valid value for the logic rule.");
      return;
    }

    setIsSubmittingRule(true);
    try {
      await api.createLogicRule(question.id, {
        operator: ruleOperator,
        value: ruleValue.trim(),
        target_question_id: targetQuestionId,
        position: question.logic_rules?.length || 0,
      });
      toast.success("Logic rule added");
      setIsAddingRule(false);
      onRefreshForm?.();
    } catch (err: unknown) {
      if (
        err instanceof ApiError &&
        err.data &&
        typeof err.data === "object" &&
        "detail" in err.data
      ) {
        toast.error(String((err.data as { detail: unknown }).detail));
      } else {
        toast.error("Failed to create logic rule");
      }
    } finally {
      setIsSubmittingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    setDeletingRuleId(ruleId);
    try {
      await api.deleteLogicRule(question.id, ruleId);
      toast.success("Logic rule deleted");
      onRefreshForm?.();
    } catch {
      toast.error("Failed to delete logic rule");
    } finally {
      setDeletingRuleId(null);
    }
  };

  return (
    <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-3.5 select-none overflow-y-auto pr-1">
      {/* Card 1: Question Segmented Control */}
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
            className={`flex-1 py-1 text-center rounded-[8px] transition-all cursor-pointer ${
              segmentedTab === "text"
                ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => {
              setSegmentedTab("video");
              toast.info("Video questions (Coming Soon)");
            }}
            className={`flex-1 py-1 text-center rounded-[8px] transition-all cursor-pointer ${
              segmentedTab === "video"
                ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Video
          </button>
        </div>

        {/* Type Selector Dropdown */}
        <div className="relative">
          <select
            value={question.type}
            onChange={(e) => onChangeType(e.target.value as QuestionType)}
            className="w-full bg-[var(--surface-page)] border border-[var(--border)] rounded-[8px] px-3 py-2 text-xs font-medium text-[var(--text-primary)] appearance-none focus:outline-hidden cursor-pointer"
          >
            {Object.entries(QUESTION_TYPE_LABELS).map(([t, { label }]) => (
              <option key={t} value={t}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Card 2: Question Settings */}
      <div className="bg-[var(--surface-card)] rounded-[16px] border border-[var(--border)] p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
          <span>Question Settings</span>
        </div>

        {/* Required Switch */}
        <div className="flex items-center justify-between pt-1">
          <label className="text-xs text-[var(--text-primary)] font-medium">
            Required
          </label>
          <button
            type="button"
            onClick={() => onUpdateQuestion({ required: !question.required })}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              question.required ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                question.required ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Type-Specific: Multiple Choice / Dropdown Options */}
        {(question.type === "multiple_choice" || question.type === "dropdown") && (
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="text-xs font-medium text-[var(--text-primary)] block">
              Options
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {question.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 bg-[var(--surface-page)] border border-[var(--border)] rounded-[6px] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="text-[var(--text-secondary)] hover:text-red-600 p-1 cursor-pointer"
                    title="Remove option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="text-xs text-[var(--text-primary)] hover:underline flex items-center gap-1 pt-1 cursor-pointer font-medium"
            >
              <Plus className="w-3 h-3" /> Add Option
            </button>
          </div>
        )}

        {/* Type-Specific: Rating Max */}
        {question.type === "rating" && (
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="text-xs font-medium text-[var(--text-primary)] block">
              Max Rating Steps
            </label>
            <select
              value={String(settings.max_rating || 5)}
              onChange={(e) => updateSetting("max_rating", Number(e.target.value))}
              className="w-full bg-[var(--surface-page)] border border-[var(--border)] rounded-[6px] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
            >
              <option value="3">3 Steps</option>
              <option value="4">4 Steps</option>
              <option value="5">5 Steps (Default)</option>
              <option value="7">7 Steps</option>
              <option value="10">10 Steps</option>
            </select>
          </div>
        )}

        {/* Type-Specific: Number Range */}
        {question.type === "number" && (
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="text-xs font-medium text-[var(--text-primary)] block">
              Number Constraints
            </label>
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

      {/* Card 3: Real Logic Jumps Editor */}
      <div className="bg-[var(--surface-card)] rounded-[16px] border border-[var(--border)] p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Logic Jumps</span>
            {question.logic_rules && question.logic_rules.length > 0 && (
              <span className="text-[10px] text-[var(--accent)] bg-[var(--surface-muted)] px-1.5 py-0.5 rounded-full font-bold">
                {question.logic_rules.length}
              </span>
            )}
          </div>
          {isLogicSupported && !isAddingRule && (
            <button
              type="button"
              onClick={initComposer}
              className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              title="Add logic rule"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add rule</span>
            </button>
          )}
        </div>

        {!isLogicSupported ? (
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Logic jumps are supported for Multiple Choice, Dropdown, Yes/No, Number, and Rating questions.
          </p>
        ) : (
          <div className="space-y-2">
            {/* List existing rules */}
            {(!question.logic_rules || question.logic_rules.length === 0) && !isAddingRule && (
              <p className="text-[11px] text-[var(--text-secondary)]">
                No jump rules configured. The respondent will proceed to the next question.
              </p>
            )}

            {question.logic_rules && question.logic_rules.length > 0 && (
              <div className="space-y-2">
                {question.logic_rules.map((rule, idx) => {
                  const targetQ = subsequentQuestions.find((q) => q.id === rule.target_question_id);
                  const targetLabel =
                    rule.target_question_id === null || rule.target_question_id === undefined
                      ? "End of form"
                      : targetQ
                      ? `Q${targetQ.position + 1}: ${targetQ.title}`
                      : `Question #${rule.target_question_id}`;

                  const opLabel =
                    availableOperators.find((o) => o.value === rule.operator)?.label || rule.operator;

                  return (
                    <div
                      key={rule.id || idx}
                      className="bg-[var(--surface-page)] border border-[var(--border)] rounded-[8px] p-2.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          Rule #{idx + 1}: If answer <strong className="text-[var(--text-primary)]">{opLabel}</strong> &ldquo;<span className="text-[var(--text-primary)] font-medium">{rule.value}</span>&rdquo;
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          disabled={deletingRuleId === rule.id}
                          className="text-[var(--text-secondary)] hover:text-red-500 p-0.5 cursor-pointer disabled:opacity-50"
                          title="Delete logic rule"
                          aria-label="Delete logic rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--surface-inner)] px-2 py-1 rounded-[4px]">
                        <ArrowRight className="w-3 h-3 text-[var(--accent)] shrink-0" />
                        <span className="truncate">Jump to: {targetLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline Rule Composer */}
            {isAddingRule && (
              <div className="bg-[var(--surface-page)] border border-[var(--border-strong)] rounded-[10px] p-3 space-y-2.5 text-xs">
                <div className="font-semibold text-[var(--text-primary)] text-[11px]">
                  New Logic Rule
                </div>

                {/* Operator Selector */}
                <div>
                  <label className="text-[10px] text-[var(--text-secondary)] block mb-1">
                    When answer:
                  </label>
                  <select
                    value={ruleOperator}
                    onChange={(e) => setRuleOperator(e.target.value as LogicOperator)}
                    className="w-full bg-[var(--surface-card)] border border-[var(--border)] rounded-[6px] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
                  >
                    {availableOperators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value Picker */}
                <div>
                  <label className="text-[10px] text-[var(--text-secondary)] block mb-1">
                    Value:
                  </label>
                  {(question.type === "multiple_choice" || question.type === "dropdown") && (
                    <select
                      value={ruleValue}
                      onChange={(e) => setRuleValue(e.target.value)}
                      className="w-full bg-[var(--surface-card)] border border-[var(--border)] rounded-[6px] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
                    >
                      {question.options.map((opt, i) => (
                        <option key={i} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {question.type === "yes_no" && (
                    <select
                      value={ruleValue}
                      onChange={(e) => setRuleValue(e.target.value)}
                      className="w-full bg-[var(--surface-card)] border border-[var(--border)] rounded-[6px] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  )}

                  {(question.type === "number" || question.type === "rating") && (
                    <input
                      type="number"
                      value={ruleValue}
                      onChange={(e) => setRuleValue(e.target.value)}
                      className="w-full bg-[var(--surface-card)] border border-[var(--border)] rounded-[6px] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-hidden"
                      placeholder="e.g. 5"
                    />
                  )}
                </div>

                {/* Target Question */}
                <div>
                  <label className="text-[10px] text-[var(--text-secondary)] block mb-1">
                    Then jump to:
                  </label>
                  <select
                    value={targetQuestionId === null ? "end" : String(targetQuestionId)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTargetQuestionId(val === "end" ? null : Number(val));
                    }}
                    className="w-full bg-[var(--surface-card)] border border-[var(--border)] rounded-[6px] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
                  >
                    <option value="end">End of form</option>
                    {subsequentQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        Q{q.position + 1}: {q.title.length > 25 ? `${q.title.slice(0, 25)}...` : q.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsAddingRule(false)}
                    className="px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[6px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateRule}
                    disabled={isSubmittingRule}
                    className="px-3 py-1 text-xs font-semibold bg-[var(--accent)] text-white rounded-[6px] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingRule ? "Saving..." : "Save rule"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
