"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Share2,
  Edit3,
  BarChart2,
  ListOrdered,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormDetail } from "@/lib/types";
import { api } from "@/lib/api";

interface ResultsHeaderProps {
  form: FormDetail;
  activeTab: "summary" | "responses";
  onChangeTab: (tab: "summary" | "responses") => void;
  onOpenShareModal: () => void;
}

export function ResultsHeader({
  form,
  activeTab,
  onChangeTab,
  onOpenShareModal,
}: ResultsHeaderProps) {
  const csvUrl = api.getCsvExportUrl(form.id);

  return (
    <header className="min-h-16 py-2.5 md:py-0 border-b border-[#E6E6E8] bg-white px-4 md:px-6 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 select-none relative z-10">
      {/* Left: Breadcrumbs & Navigation */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6570] hover:text-[#2B2530] transition-colors p-1 rounded-[6px] hover:bg-[#F5F5F5]"
          title="Back to Workspace"
          aria-label="Back to forms"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Forms</span>
        </Link>

        <ChevronRight className="w-3 h-3 text-[#A8A3AD]" />

        <Link
          href={`/forms/${form.id}/edit`}
          className="text-xs font-semibold text-[#6B6570] hover:text-[#2B2530] transition-colors truncate max-w-[120px] sm:max-w-[180px]"
          title="Go to form builder"
        >
          {form.title}
        </Link>

        <ChevronRight className="w-3 h-3 text-[#A8A3AD]" />

        <span className="text-[11px] font-bold text-[#2B2530] uppercase tracking-wider bg-[#F5F5F5] px-2 py-0.5 rounded-[4px] border border-[#E6E6E8]">
          Results
        </span>
      </div>

      {/* Center: Tabs Summary | Responses */}
      <div className="flex items-center p-1 bg-[#EAEAEC] rounded-[10px] text-xs font-medium order-3 md:order-2 w-full md:w-auto justify-center">
        <button
          type="button"
          onClick={() => onChangeTab("summary")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-[8px] transition-all ${
            activeTab === "summary"
              ? "bg-white text-[#2B2530] font-semibold shadow-xs"
              : "text-[#6B6570] hover:text-[#2B2530]"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Summary</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab("responses")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-[8px] transition-all ${
            activeTab === "responses"
              ? "bg-white text-[#2B2530] font-semibold shadow-xs"
              : "text-[#6B6570] hover:text-[#2B2530]"
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Responses ({form.response_count})</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 order-2 md:order-3">
        <Link href={`/forms/${form.id}/edit`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-medium px-2 sm:px-3.5" title="Edit form">
            <Edit3 className="w-3.5 h-3.5 text-[#6B6570]" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </Link>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenShareModal}
          className="gap-1.5 text-xs font-medium px-2 sm:px-3.5"
          title="Share form"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        {/* Download CSV Button */}
        <a href={csvUrl} download className="inline-block" title="Download CSV">
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 text-xs font-medium bg-[#2B2530] text-white hover:bg-[#3A3340] px-2.5 sm:px-3.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </a>
      </div>
    </header>
  );
}
