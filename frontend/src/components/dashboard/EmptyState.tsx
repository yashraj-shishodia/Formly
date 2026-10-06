"use client";

import React from "react";
import { FolderPlus, SearchX, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  isSearch: boolean;
  searchTerm?: string;
  onClearSearch?: () => void;
  onCreateForm: () => void;
}

export function EmptyState({
  isSearch,
  searchTerm,
  onClearSearch,
  onCreateForm,
}: EmptyStateProps) {
  if (isSearch) {
    return (
      <div className="py-16 px-6 text-center bg-white rounded-[16px] border border-[#E6E6E8] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#F5F5F5] border border-[#E6E6E8] flex items-center justify-center text-[#6B6570]">
          <SearchX className="w-6 h-6 text-[#A8A3AD]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#2B2530]">
            No forms found
          </h3>
          <p className="text-xs text-[#6B6570] max-w-sm">
            We couldn&apos;t find any forms matching &quot;{searchTerm}&quot;. Try checking for typos or searching a different term.
          </p>
        </div>
        {onClearSearch && (
          <Button variant="secondary" size="sm" onClick={onClearSearch}>
            Clear search filter
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="py-20 px-6 text-center bg-white rounded-[20px] border border-[#E6E6E8] flex flex-col items-center justify-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-[#F5F5F5] border border-[#E6E6E8] flex items-center justify-center text-[#2B2530]">
        <FolderPlus className="w-8 h-8 text-[#6B6570]" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-bold text-[#2B2530]">
          Your workspace is empty
        </h3>
        <p className="text-sm text-[#6B6570] leading-relaxed">
          Create your very first form to start collecting questions, responses, ratings, and feedback.
        </p>
      </div>
      <Button
        variant="primary"
        size="lg"
        onClick={onCreateForm}
        className="gap-2 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        <span>Create your first form</span>
      </Button>
    </div>
  );
}
