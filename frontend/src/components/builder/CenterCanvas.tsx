"use client";

import React, { useState } from "react";
import {
  Plus,
  Palette,
  Play,
  Check,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Question, FormDetail } from "@/lib/types";
import { ShortTextInput } from "../respondent/inputs/ShortTextInput";
import { LongTextInput } from "../respondent/inputs/LongTextInput";
import { MultipleChoiceInput } from "../respondent/inputs/MultipleChoiceInput";
import { YesNoInput } from "../respondent/inputs/YesNoInput";
import { EmailInput } from "../respondent/inputs/EmailInput";
import { NumberInput } from "../respondent/inputs/NumberInput";
import { RatingInput } from "../respondent/inputs/RatingInput";
import { DropdownInput } from "../respondent/inputs/DropdownInput";

interface CenterCanvasProps {
  form: FormDetail;
  question: Question | null;
  onUpdateQuestion: (fields: Partial<Question>) => void;
  onOpenAddModal: () => void;
  onOpenDesignModal: () => void;
  onOpenPreview: () => void;
  isSaving?: boolean;
  isEndingsSelected: boolean;
  onUpdateEndings: (title: string, message: string) => void;
  isWelcomeSelected: boolean;
  onUpdateWelcome: (title: string, description: string) => void;
}

export function CenterCanvas({
  form,
  question,
  onUpdateQuestion,
  onOpenAddModal,
  onOpenDesignModal,
  onOpenPreview,
  isSaving = false,
  isEndingsSelected,
  onUpdateEndings,
  isWelcomeSelected,
  onUpdateWelcome,
}: CenterCanvasProps) {
  // Local state mirror for smooth typing without dropped characters
  const [prevQuestionId, setPrevQuestionId] = useState<number | null>(question?.id ?? null);
  const [localTitle, setLocalTitle] = useState(question?.title || "");
  const [localDesc, setLocalDesc] = useState(question?.description || "");

  if (question && question.id !== prevQuestionId) {
    setPrevQuestionId(question.id);
    setLocalTitle(question.title);
    setLocalDesc(question.description || "");
  } else if (!question && prevQuestionId !== null) {
    setPrevQuestionId(null);
    setLocalTitle("");
    setLocalDesc("");
  }

  // Render live answer component in canvas
  const renderAnswerPreview = () => {
    if (!question) return null;

    let settings: Record<string, unknown> = {};
    if (question.settings_json) {
      try {
        settings = JSON.parse(question.settings_json);
      } catch {
        settings = {};
      }
    }

    switch (question.type) {
      case "short_text":
        return (
          <ShortTextInput
            value=""
            onChange={() => {}}
            onSubmit={() => {}}
            placeholder="Type your answer here..."
            autoFocus={false}
          />
        );

      case "long_text":
        return (
          <LongTextInput
            value=""
            onChange={() => {}}
            onSubmit={() => {}}
            placeholder="Type your answer here..."
            autoFocus={false}
          />
        );

      case "multiple_choice":
        return (
          <MultipleChoiceInput
            options={question.options}
            value=""
            onChange={() => {}}
            isMultiSelect={!!settings.allow_multiple}
          />
        );

      case "yes_no":
        return (
          <YesNoInput
            value={null}
            onChange={() => {}}
          />
        );

      case "email":
        return (
          <EmailInput
            value=""
            onChange={() => {}}
            onSubmit={() => {}}
            placeholder="name@example.com"
            autoFocus={false}
          />
        );

      case "number":
        return (
          <NumberInput
            value=""
            onChange={() => {}}
            onSubmit={() => {}}
            placeholder="0"
            autoFocus={false}
          />
        );

      case "rating":
        return (
          <RatingInput
            value={null}
            onChange={() => {}}
            maxRating={
              typeof settings.max_rating === "number" ? settings.max_rating : 5
            }
          />
        );

      case "dropdown":
        return (
          <DropdownInput
            options={question.options}
            value=""
            onChange={() => {}}
          />
        );

      case "file_upload":
        return (
          <div className="w-full max-w-md p-6 rounded-[12px] border-2 border-dashed border-[var(--border)] bg-[var(--surface-inner)] flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              Choose file or drag here
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Files up to 10MB supported
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      {/* Top Toolbar Card per DESIGN_SPEC §3 */}
      <div className="bg-[var(--surface-card)] rounded-[16px] border border-[var(--border)] px-4 py-2 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          {/* + Add content button */}
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddModal}
            className="gap-1.5 text-xs font-semibold px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add content</span>
          </Button>

          <div className="w-px h-4 bg-[var(--border-strong)]" />

          {/* Design / Theme button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDesignModal}
            className="gap-1.5 text-xs font-medium text-[var(--text-primary)]"
          >
            <Palette className="w-3.5 h-3.5 text-[#8E4FC0]" />
            <span>Design</span>
          </Button>

          <div className="w-px h-4 bg-[var(--border-strong)]" />

          {/* Preview Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenPreview}
            className="gap-1.5 text-xs font-medium bg-[var(--surface-page)]"
          >
            <Play className="w-3.5 h-3.5 fill-[var(--text-primary)]" />
            <span>Preview</span>
          </Button>
        </div>

        {/* Autosave Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8E4FC0]" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Center Canvas Card per DESIGN_SPEC §3 (ref-14) */}
      <div className="flex-1 bg-[var(--surface-card)] rounded-[20px] border border-[var(--border)] p-6 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-[640px] bg-[var(--surface-page)] rounded-[16px] border border-[var(--border)] p-8 md:p-12 shadow-xs min-h-[460px] flex flex-col justify-center font-karla">
          {/* If Endings is selected */}
          {isEndingsSelected && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#2F7D69] uppercase tracking-wider">
                Ending Screen Preview
              </span>
              <input
                type="text"
                value={form.thank_you_title || "Thank you!"}
                onChange={(e) =>
                  onUpdateEndings(
                    e.target.value,
                    form.thank_you_message || "Your response has been recorded."
                  )
                }
                placeholder="Thank you title..."
                className="w-full text-2xl md:text-3xl font-normal text-[var(--text-primary)] border-b border-transparent hover:border-[var(--border-strong)] focus:border-[var(--primary)] pb-1 focus:outline-hidden"
              />
              <textarea
                rows={2}
                value={form.thank_you_message || "Your response has been recorded."}
                onChange={(e) =>
                  onUpdateEndings(
                    form.thank_you_title || "Thank you!",
                    e.target.value
                  )
                }
                placeholder="Thank you message..."
                className="w-full text-base text-[var(--text-secondary)] border-b border-transparent hover:border-[var(--border-strong)] focus:border-[var(--primary)] pb-1 focus:outline-hidden resize-none leading-relaxed"
              />
            </div>
          )}

          {/* If Welcome is selected */}
          {isWelcomeSelected && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#8E4FC0] uppercase tracking-wider">
                Welcome Screen Preview
              </span>
              <input
                type="text"
                value={form.welcome_screen?.title || "Welcome"}
                onChange={(e) =>
                  onUpdateWelcome(
                    e.target.value,
                    form.welcome_screen?.description || ""
                  )
                }
                placeholder="Welcome title..."
                className="w-full text-2xl md:text-3xl font-normal text-[var(--text-primary)] border-b border-transparent hover:border-[var(--border-strong)] focus:border-[var(--primary)] pb-1 focus:outline-hidden"
              />
              <textarea
                rows={2}
                value={form.welcome_screen?.description || ""}
                onChange={(e) =>
                  onUpdateWelcome(
                    form.welcome_screen?.title || "Welcome",
                    e.target.value
                  )
                }
                placeholder="Add welcome message or instructions..."
                className="w-full text-base text-[var(--text-secondary)] border-b border-transparent hover:border-[var(--border-strong)] focus:border-[var(--primary)] pb-1 focus:outline-hidden resize-none leading-relaxed"
              />
            </div>
          )}

          {/* If regular Question is selected */}
          {!isEndingsSelected && !isWelcomeSelected && question && (
            <div className="space-y-6">
              {/* Question Header: Number badge + Title + Description */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  {/* Number Badge */}
                  <div className="mt-1 w-6 h-6 rounded-[5px] bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {question.position + 1}
                    <span className="text-[9px] ml-0.5 opacity-80">→</span>
                  </div>

                  <div className="flex-1 space-y-1">
                    {/* Inline Editable Question Title */}
                    <input
                      type="text"
                      value={localTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalTitle(val);
                        onUpdateQuestion({ title: val });
                      }}
                      placeholder="Type your question here..."
                      className="w-full text-2xl md:text-[28px] font-normal text-[var(--text-primary)] border-b border-transparent hover:border-[var(--border-strong)] focus:border-[var(--primary)] pb-1 focus:outline-hidden leading-tight font-karla"
                    />

                    {/* Inline Editable Description */}
                    <input
                      type="text"
                      value={localDesc}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalDesc(val);
                        onUpdateQuestion({ description: val });
                      }}
                      placeholder="Description (optional)"
                      className="w-full text-sm text-[var(--text-secondary)] italic border-b border-transparent hover:border-[var(--border-strong)] focus:border-[var(--primary)] pb-0.5 focus:outline-hidden font-karla"
                    />
                  </div>
                </div>
              </div>

              {/* Answer Control Preview */}
              <div className="pt-2 pl-9">
                {renderAnswerPreview()}
              </div>
            </div>
          )}

          {/* If no question selected */}
          {!isEndingsSelected && !isWelcomeSelected && !question && (
            <div className="text-center py-12 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                No question selected. Click &quot;Add content&quot; to add your first question.
              </p>
              <Button variant="primary" size="md" onClick={onOpenAddModal}>
                Add question
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
