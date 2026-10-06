"use client";

import React, { useState } from "react";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useFormResponses, useDeleteResponse } from "@/hooks/useForms";
import { Question, ResponseListItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface ResponsesViewProps {
  formId: number;
  questions: Question[];
}

export function ResponsesView({ formId, questions }: ResponsesViewProps) {
  const [page, setPage] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState<ResponseListItem | null>(null);

  const { data: responseData, isLoading, isError } = useFormResponses(formId, page, 20);
  const deleteMutation = useDeleteResponse(formId);

  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "In progress";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleDelete = async (e: React.MouseEvent, responseId: number) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete response #${responseId}?`)) {
      await deleteMutation.mutateAsync(responseId);
      if (selectedResponse?.id === responseId) {
        setSelectedResponse(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-[#6B6570]">
        Loading responses table...
      </div>
    );
  }

  if (isError || !responseData) {
    return (
      <div className="py-16 text-center text-xs text-red-600">
        Failed to load responses.
      </div>
    );
  }

  const totalPages = Math.ceil(responseData.total / responseData.page_size) || 1;

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-16">
      {/* Table Container */}
      <div className="bg-white rounded-[16px] border border-[#E6E6E8] shadow-2xs overflow-hidden">
        {/* Table Header Info */}
        <div className="px-6 py-4 border-b border-[#F0EFF2] flex items-center justify-between">
          <span className="text-sm font-semibold text-[#2B2530]">
            All Responses ({responseData.total})
          </span>
          <span className="text-xs text-[#6B6570]">
            Showing page {page} of {totalPages}
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#E6E6E8] text-[#6B6570] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-16">#</th>
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4 w-44">Submitted At</th>
                {sortedQuestions.slice(0, 4).map((q) => (
                  <th key={q.id} className="py-3 px-4 max-w-[200px] truncate">
                    {q.title}
                  </th>
                ))}
                <th className="py-3 px-4 text-right w-20">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F0EFF2] text-[#2B2530]">
              {responseData.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + Math.min(4, sortedQuestions.length)}
                    className="py-12 text-center text-[#A8A3AD]"
                  >
                    No responses collected yet.
                  </td>
                </tr>
              ) : (
                responseData.items.map((r, idx) => {
                  const isCompleted = r.status === "completed";
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedResponse(r)}
                      className="hover:bg-[#F9F9FA] cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono text-[#6B6570]">
                        #{r.id}
                      </td>

                      <td className="py-3 px-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6F4EA] text-[#2F7D69] border border-[#2F7D69]/20">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Partial
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#6B6570]">
                        {formatDate(r.submitted_at)}
                      </td>

                      {sortedQuestions.slice(0, 4).map((q) => {
                        const ans = r.answers[q.id];
                        let displayVal = "—";
                        if (ans !== undefined && ans !== null) {
                          if (Array.isArray(ans)) {
                            displayVal = ans.join(", ");
                          } else if (typeof ans === "boolean") {
                            displayVal = ans ? "Yes" : "No";
                          } else {
                            displayVal = String(ans);
                          }
                        }

                        return (
                          <td
                            key={q.id}
                            className="py-3 px-4 max-w-[200px] truncate text-[#2B2530]"
                            title={displayVal}
                          >
                            {displayVal}
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, r.id)}
                          className="p-1 rounded text-[#A8A3AD] hover:text-[#D9383A] hover:bg-red-50 transition-colors"
                          title="Delete response"
                          aria-label={`Delete response #${r.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-[#F0EFF2] flex items-center justify-between bg-[#FAFAFA]">
            <span className="text-xs text-[#6B6570]">
              Page {page} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="gap-1 text-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Answer Detail Slide-over Modal / Drawer */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-[#2B2530]/40 backdrop-blur-xs flex justify-end animate-in fade-in-50 duration-150">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto font-sans animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#F0EFF2] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#2B2530]">
                  Response #{selectedResponse.id}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#6B6570] mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(selectedResponse.submitted_at)}
                  </span>
                  <span>•</span>
                  <span
                    className={`capitalize font-semibold ${
                      selectedResponse.status === "completed"
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    ● {selectedResponse.status}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#6B6570] hover:text-[#2B2530] transition-colors"
                aria-label="Close response details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Answer List */}
            <div className="flex-1 py-6 space-y-6">
              {sortedQuestions.map((q, idx) => {
                const ans = selectedResponse.answers[q.id];
                let displayVal = "No answer provided";
                const hasAnswer = ans !== undefined && ans !== null && ans !== "";

                if (hasAnswer) {
                  if (Array.isArray(ans)) {
                    displayVal = ans.join(", ");
                  } else if (typeof ans === "boolean") {
                    displayVal = ans ? "Yes" : "No";
                  } else {
                    displayVal = String(ans);
                  }
                }

                return (
                  <div
                    key={q.id}
                    className="space-y-1.5 p-3.5 rounded-[12px] bg-[#FAFAFA] border border-[#E6E6E8]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-[4px] bg-[#2B2530] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#2B2530]">
                        {q.title}
                      </span>
                    </div>

                    <div className="pl-7">
                      <p
                        className={`text-sm font-medium ${
                          hasAnswer ? "text-[#2B2530]" : "text-[#A8A3AD] italic"
                        }`}
                      >
                        {displayVal}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#F0EFF2] flex justify-end">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedResponse(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
