"use client";

import React, { useState, use } from "react";
import { useForm } from "@/hooks/useForms";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ResultsHeader } from "@/components/results/ResultsHeader";
import { SummaryView } from "@/components/results/SummaryView";
import { ResponsesView } from "@/components/results/ResponsesView";
import { ShareModal } from "@/components/dashboard/ShareModal";

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

export default function FormResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = use(params);
  const formId = parseInt(resolvedParams.id, 10);

  const { data: form, isLoading, isError } = useForm(formId);
  const [activeTab, setActiveTab] = useState<"summary" | "responses">("summary");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (isLoading) {
    return <LoadingScreen message="Loading results & analytics..." />;
  }

  if (isError || !form) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="text-xl font-bold text-[#2B2530] mb-2">Form not found</h2>
        <p className="text-xs text-[#6B6570]">
          Could not find form #{formId}. Please return to workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFD] flex flex-col font-sans">
      {/* Top Header with Tab Switcher, Breadcrumb & Actions */}
      <ResultsHeader
        form={form}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {activeTab === "summary" ? (
          <SummaryView formId={formId} />
        ) : (
          <ResponsesView formId={formId} questions={form.questions} />
        )}
      </main>

      {/* Share / Publish Modal */}
      <ShareModal
        form={{
          id: form.id,
          title: form.title,
          slug: form.slug,
          status: form.status,
          response_count: form.response_count,
          created_at: "",
          updated_at: "",
        }}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
