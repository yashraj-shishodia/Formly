"use client";

import React from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Star,
  Type,
  AlignLeft,
  ListFilter,
  ChevronDownSquare,
  ToggleLeft,
  Mail,
  Hash,
  Upload,
  Paperclip,
} from "lucide-react";
import { useFormSummary } from "@/hooks/useForms";
import { QuestionType } from "@/lib/types";

interface SummaryViewProps {
  formId: number;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds <= 0) {
    return "N/A";
  }
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function getQuestionTypeBadge(type: QuestionType) {
  switch (type) {
    case "short_text":
      return { label: "Short Text", icon: Type, bg: "bg-[#E1F0FF]", color: "text-[#0066CC]" };
    case "long_text":
      return { label: "Long Text", icon: AlignLeft, bg: "bg-[#E1F0FF]", color: "text-[#0066CC]" };
    case "multiple_choice":
      return { label: "Multiple Choice", icon: ListFilter, bg: "bg-[#F3EAFB]", color: "text-[#8E4FC0]" };
    case "dropdown":
      return { label: "Dropdown", icon: ChevronDownSquare, bg: "bg-[#F3EAFB]", color: "text-[#8E4FC0]" };
    case "yes_no":
      return { label: "Yes / No", icon: ToggleLeft, bg: "bg-[#F3EAFB]", color: "text-[#8E4FC0]" };
    case "email":
      return { label: "Email", icon: Mail, bg: "bg-[#FDE8F1]", color: "text-[#D83A7D]" };
    case "number":
      return { label: "Number", icon: Hash, bg: "bg-[#FEF6E6]", color: "text-[#B25E00]" };
    case "rating":
      return { label: "Rating", icon: Star, bg: "bg-[#E6F4EA]", color: "text-[#2F7D69]" };
    case "file_upload":
      return { label: "File Upload", icon: Upload, bg: "bg-[#F3EAFB]", color: "text-[#8E4FC0]" };
    default:
      return { label: type, icon: Type, bg: "bg-[#E1F0FF]", color: "text-[#0066CC]" };
  }
}

export function SummaryView({ formId }: SummaryViewProps) {
  const { data: summary, isLoading, isError } = useFormSummary(formId);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-[#6B6570]">
        Loading analytics summary...
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="py-12 text-center text-xs text-red-600">
        Failed to load analytics summary.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* 4 Metric Stat Cards per DESIGN_SPEC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Responses */}
        <div className="bg-[var(--surface-card)] p-5 rounded-[16px] border border-[var(--border)] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Responses
            </span>
            <Users className="w-4 h-4 text-[#8E4FC0]" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {summary.total_responses}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">All form submissions</p>
        </div>

        {/* Completed vs Partial */}
        <div className="bg-[var(--surface-card)] p-5 rounded-[16px] border border-[var(--border)] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Completed / Partial
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight flex items-baseline gap-2">
            <span>{summary.completed_responses}</span>
            <span className="text-sm font-medium text-[var(--text-muted)]">
              / {summary.partial_responses} partial
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Finished all required fields</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-[var(--surface-card)] p-5 rounded-[16px] border border-[var(--border)] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Completion Rate
            </span>
            <TrendingUp className="w-4 h-4 text-[#2F7D69]" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {summary.completion_rate.toFixed(1)}%
          </div>
          <div className="w-full bg-[var(--surface-canvas)] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2F7D69] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, summary.completion_rate)}%` }}
            />
          </div>
        </div>

        {/* Average Duration */}
        <div className="bg-[var(--surface-card)] p-5 rounded-[16px] border border-[var(--border)] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Average Time
            </span>
            <Clock className="w-4 h-4 text-[#B25E00]" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {formatDuration(summary.average_duration_seconds)}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Time to completion</p>
        </div>
      </div>

      {/* Per-Question Analytical Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
          Questions Breakdown ({summary.questions.length})
        </h2>

        {summary.questions.length === 0 ? (
          <div className="bg-[var(--surface-card)] p-8 rounded-[16px] border border-[var(--border)] text-center text-xs text-[var(--text-secondary)]">
            No responses recorded yet for this form.
          </div>
        ) : (
          summary.questions.map((q, idx) => {
            const badge = getQuestionTypeBadge(q.type);
            const Icon = badge.icon;

            return (
              <div
                key={q.question_id}
                className="bg-[var(--surface-card)] rounded-[16px] border border-[var(--border)] p-6 shadow-2xs space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-[5px] bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {q.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium ${badge.bg} ${badge.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] font-medium">
                      {q.total_answers} {q.total_answers === 1 ? "answer" : "answers"}
                    </span>
                  </div>
                </div>

                {/* Multiple Choice & Dropdown: Visual Option Bars */}
                {(q.type === "multiple_choice" || q.type === "dropdown") && (
                  <div className="space-y-3 pt-1">
                    {q.option_stats && q.option_stats.length > 0 ? (
                      q.option_stats.map((opt) => (
                        <div key={opt.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-[var(--text-primary)]">
                            <span className="font-medium">{opt.label}</span>
                            <span className="font-bold text-[var(--text-secondary)]">
                              {opt.count} ({opt.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-[var(--surface-canvas)] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#8E4FC0] rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, opt.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[var(--text-muted)]">No answers recorded</p>
                    )}
                  </div>
                )}

                {/* Rating: Average Score & Distribution */}
                {q.type === "rating" && (() => {
                  const maxRating = q.max_rating || 5;
                  const ratingScale = Array.from({ length: maxRating }, (_, i) => i + 1);

                  return (
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center gap-4 p-4 bg-[var(--surface-inner)] rounded-[12px] border border-[var(--border)] w-fit">
                        <div className="text-4xl font-bold text-[var(--text-primary)]">
                          {q.average != null ? q.average.toFixed(1) : "N/A"}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[var(--text-primary)] flex-wrap max-w-xs">
                            {ratingScale.map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  (q.average || 0) >= star
                                    ? "fill-[var(--text-primary)] text-[var(--text-primary)]"
                                    : "text-[var(--border-strong)]"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[var(--text-secondary)] block">
                            Average score out of {maxRating}
                          </span>
                        </div>
                      </div>

                      {/* Score distribution */}
                      {q.distribution && (
                        <div
                          className="grid gap-2 pt-2"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(maxRating, 10)}, minmax(0, 1fr))`,
                          }}
                        >
                          {ratingScale.map((score) => {
                            const count = q.distribution?.[String(score)] || 0;
                            return (
                              <div
                                key={score}
                                className="p-2.5 rounded-[8px] bg-[var(--surface-inner)] border border-[var(--border)] text-center min-w-[36px]"
                              >
                                <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                                  {score} ★
                                </span>
                                <span className="text-base font-bold text-[var(--text-primary)] mt-0.5 block">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Yes / No: Visual Split */}
                {q.type === "yes_no" && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#2F7D69]">
                        Yes: {q.yes_count || 0} ({(q.yes_percentage || 0).toFixed(1)}%)
                      </span>
                      <span className="text-[#D9383A]">
                        No: {q.no_count || 0} ({(q.no_percentage || 0).toFixed(1)}%)
                      </span>
                    </div>

                    <div className="w-full bg-[var(--surface-canvas)] h-3 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-[#2F7D69] transition-all duration-500"
                        style={{ width: `${q.yes_percentage || 0}%` }}
                      />
                      <div
                        className="h-full bg-[#D9383A] transition-all duration-500"
                        style={{ width: `${q.no_percentage || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Number: Stats */}
                {q.type === "number" && (
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="p-3 bg-[var(--surface-inner)] rounded-[10px] border border-[var(--border)]">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Average
                      </span>
                      <span className="text-xl font-bold text-[var(--text-primary)] mt-1 block">
                        {q.average != null ? q.average.toFixed(2) : "N/A"}
                      </span>
                    </div>
                    <div className="p-3 bg-[var(--surface-inner)] rounded-[10px] border border-[var(--border)]">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Min
                      </span>
                      <span className="text-xl font-bold text-[var(--text-primary)] mt-1 block">
                        {q.min_value != null ? q.min_value : "N/A"}
                      </span>
                    </div>
                    <div className="p-3 bg-[var(--surface-inner)] rounded-[10px] border border-[var(--border)]">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        Max
                      </span>
                      <span className="text-xl font-bold text-[var(--text-primary)] mt-1 block">
                        {q.max_value != null ? q.max_value : "N/A"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Text & Email: Recent answers */}
                {(q.type === "short_text" || q.type === "long_text" || q.type === "email") && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                      Latest submissions
                    </span>
                    {q.recent_answers && q.recent_answers.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {q.recent_answers.map((ans, i) => (
                          <div
                            key={i}
                            className="p-2.5 bg-[var(--surface-inner)] rounded-[8px] border border-[var(--border)] text-xs text-[var(--text-primary)] leading-relaxed"
                          >
                            &quot;{ans}&quot;
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)]">No answers recorded yet</p>
                    )}
                  </div>
                )}

                {/* File Upload: Count of files received & recent files */}
                {q.type === "file_upload" && (
                  <div className="space-y-3 pt-1">
                    <div className="p-4 bg-[var(--surface-inner)] rounded-[12px] border border-[var(--border)] w-fit flex items-center gap-3">
                      <div className="text-3xl font-bold text-[var(--text-primary)]">
                        {q.total_answers}
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] font-medium">
                        {q.total_answers === 1 ? "file received" : "files received"}
                      </span>
                    </div>

                    {q.recent_answers && q.recent_answers.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                          Latest uploaded files
                        </span>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {q.recent_answers.map((fileName, i) => (
                            <div
                              key={i}
                              className="p-2.5 bg-[var(--surface-inner)] rounded-[8px] border border-[var(--border)] text-xs text-[var(--text-primary)] flex items-center gap-2"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                              <span className="truncate">{fileName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
