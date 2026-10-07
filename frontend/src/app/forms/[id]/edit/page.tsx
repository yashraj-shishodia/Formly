"use client";

import React, { useState, use, useEffect, useRef } from "react";
import {
  useForm,
  useAddQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useReorderQuestions,
  useUpdateForm,
  usePublishForm,
} from "@/hooks/useForms";
import { Question, QuestionType, ThemeConfig } from "@/lib/types";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { BuilderHeader } from "@/components/builder/BuilderHeader";
import { LeftPagesPanel } from "@/components/builder/LeftPagesPanel";
import { CenterCanvas } from "@/components/builder/CenterCanvas";
import { RightSettingsPanel } from "@/components/builder/RightSettingsPanel";
import { AddContentModal } from "@/components/builder/AddContentModal";
import { DesignModal } from "@/components/builder/DesignModal";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { FormRunner } from "@/components/respondent/FormRunner";
import { toast } from "sonner";

interface BuilderPageProps {
  params: Promise<{ id: string }>;
}

export default function FormBuilderPage({ params }: BuilderPageProps) {
  const resolvedParams = use(params);
  const formId = parseInt(resolvedParams.id, 10);

  const { data: form, isLoading, isError } = useForm(formId);

  // Mutations
  const addQuestionMutation = useAddQuestion(formId);
  const updateQuestionMutation = useUpdateQuestion(formId);
  const deleteQuestionMutation = useDeleteQuestion(formId);
  const reorderQuestionsMutation = useReorderQuestions(formId);
  const updateFormMutation = useUpdateForm(formId);
  const publishMutation = usePublishForm(formId);

  // Selected state
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [isEndingsSelected, setIsEndingsSelected] = useState(false);
  const [isWelcomeSelected, setIsWelcomeSelected] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Responsive mobile/tablet view switcher
  const [mobileTab, setMobileTab] = useState<"questions" | "canvas" | "settings">("canvas");

  // Debounce autosave timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Select first question automatically once loaded
  useEffect(() => {
    if (form && form.questions.length > 0 && selectedQuestionId === null && !isEndingsSelected && !isWelcomeSelected) {
      setSelectedQuestionId(form.questions[0].id);
    }
  }, [form, selectedQuestionId, isEndingsSelected, isWelcomeSelected]);

  if (isLoading) {
    return <LoadingScreen message="Loading builder..." />;
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

  const sortedQuestions = [...form.questions].sort((a, b) => a.position - b.position);
  const selectedQuestion = sortedQuestions.find((q) => q.id === selectedQuestionId) || null;

  // Add question handler
  const handleAddQuestion = async (type: QuestionType) => {
    try {
      const defaultOptions =
        type === "multiple_choice" || type === "dropdown"
          ? [
              { label: "Option 1", position: 0 },
              { label: "Option 2", position: 1 },
            ]
          : undefined;

      const newQ = await addQuestionMutation.mutateAsync({
        type,
        title: "",
        position: sortedQuestions.length,
        options: defaultOptions,
      });

      setIsEndingsSelected(false);
      setIsWelcomeSelected(false);
      setSelectedQuestionId(newQ.id);
    } catch {
      // Error handled in hook
    }
  };

  // Inline question update with debounced autosave
  const handleUpdateQuestion = (fields: Partial<Question>) => {
    if (!selectedQuestion) return;

    // Trigger mutation
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateQuestionMutation.mutate({
        questionId: selectedQuestion.id,
        data: {
          title: fields.title !== undefined ? fields.title : selectedQuestion.title,
          description: fields.description !== undefined ? fields.description : selectedQuestion.description,
          required: fields.required !== undefined ? fields.required : selectedQuestion.required,
          settings_json: fields.settings_json !== undefined ? fields.settings_json : selectedQuestion.settings_json,
        },
      });
    }, 400);
  };

  // Change question type
  const handleChangeType = (type: QuestionType) => {
    if (!selectedQuestion) return;
    const defaultOptions =
      (type === "multiple_choice" || type === "dropdown") && selectedQuestion.options.length === 0
        ? [
            { label: "Option 1", position: 0 },
            { label: "Option 2", position: 1 },
          ]
        : undefined;

    updateQuestionMutation.mutate({
      questionId: selectedQuestion.id,
      data: {
        type,
        options: defaultOptions,
      },
    });
  };

  // Options update for multiple choice / dropdown
  const handleUpdateOptions = (options: Array<{ label: string; position: number }>) => {
    if (!selectedQuestion) return;
    updateQuestionMutation.mutate({
      questionId: selectedQuestion.id,
      data: {
        options,
      },
    });
  };

  // Delete question
  const handleDeleteQuestion = async (id: number) => {
    try {
      await deleteQuestionMutation.mutateAsync(id);
      if (selectedQuestionId === id) {
        const remaining = sortedQuestions.filter((q) => q.id !== id);
        if (remaining.length > 0) {
          setSelectedQuestionId(remaining[0].id);
        } else {
          setSelectedQuestionId(null);
        }
      }
    } catch {
      // Handled in mutation onError
    }
  };

  // Duplicate question
  const handleDuplicateQuestion = async (id: number) => {
    const target = sortedQuestions.find((q) => q.id === id);
    if (!target) return;

    try {
      const newQ = await addQuestionMutation.mutateAsync({
        type: target.type,
        title: `${target.title || "Untitled"} (Copy)`,
        description: target.description || undefined,
        required: target.required,
        position: sortedQuestions.length,
        settings_json: target.settings_json || undefined,
        options: target.options.map((o) => ({ label: o.label, position: o.position })),
      });
      setSelectedQuestionId(newQ.id);
    } catch {
      // Handled in mutation onError
    }
  };

  // Reorder questions
  const handleReorder = (newQuestions: Question[]) => {
    const questionIds = newQuestions.map((q) => q.id);
    reorderQuestionsMutation.mutate(questionIds);
  };

  // Endings update
  const handleUpdateEndings = (title: string, message: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateFormMutation.mutate({
        thank_you_title: title,
        thank_you_message: message,
      });
    }, 400);
  };

  // Welcome screen update
  const handleUpdateWelcome = (title: string, description: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateFormMutation.mutate({
        welcome_screen: {
          enabled: true,
          title,
          description,
          button_text: form.welcome_screen?.button_text || "Start",
        },
      });
    }, 400);
  };

  // Save theme
  const handleSaveTheme = (theme: ThemeConfig) => {
    updateFormMutation.mutate({
      theme,
    });
    toast.success("Theme applied");
  };

  const isSaving =
    updateQuestionMutation.isPending ||
    updateFormMutation.isPending ||
    reorderQuestionsMutation.isPending;

  return (
    <div className="h-screen bg-white flex flex-col font-sans overflow-hidden">
      {/* Top Bar per DESIGN_SPEC §3 */}
      <BuilderHeader
        form={form}
        onUpdateTitle={(title) => updateFormMutation.mutate({ title })}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onPublish={() => publishMutation.mutate()}
        isPublishing={publishMutation.isPending}
      />

      {/* Mobile / Tablet Segmented Panel Bar (< lg) */}
      <div className="lg:hidden flex border-b border-[#E6E6E8] bg-[#FAFAFA] px-4 py-2 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab("questions")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
            mobileTab === "questions"
              ? "bg-white text-[#2B2530] shadow-xs border border-[#E6E6E8]"
              : "text-[#6B6570] hover:text-[#2B2530]"
          }`}
        >
          Questions ({sortedQuestions.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("canvas")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
            mobileTab === "canvas"
              ? "bg-white text-[#2B2530] shadow-xs border border-[#E6E6E8]"
              : "text-[#6B6570] hover:text-[#2B2530]"
          }`}
        >
          Canvas
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("settings")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
            mobileTab === "settings"
              ? "bg-white text-[#2B2530] shadow-xs border border-[#E6E6E8]"
              : "text-[#6B6570] hover:text-[#2B2530]"
          }`}
        >
          Settings
        </button>
      </div>

      {/* Main 3-Column Layout (~16px gaps per DESIGN_SPEC §3) */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden bg-white">
        {/* Left Column (~270px) */}
        <div
          className={`${
            mobileTab === "questions" ? "flex flex-1 w-full" : "hidden"
          } lg:flex lg:w-[270px] lg:shrink-0 overflow-hidden`}
        >
          <LeftPagesPanel
            questions={sortedQuestions}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={(id) => {
              setSelectedQuestionId(id);
              setIsEndingsSelected(false);
              setIsWelcomeSelected(false);
              setMobileTab("canvas");
            }}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onDuplicateQuestion={handleDuplicateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onReorder={handleReorder}
            isEndingsSelected={isEndingsSelected}
            onSelectEndings={() => {
              setIsEndingsSelected(true);
              setIsWelcomeSelected(false);
              setSelectedQuestionId(null);
              setMobileTab("canvas");
            }}
            welcomeScreenEnabled={!!form.welcome_screen?.enabled}
            isWelcomeSelected={isWelcomeSelected}
            onSelectWelcome={() => {
              setIsWelcomeSelected(true);
              setIsEndingsSelected(false);
              setSelectedQuestionId(null);
              setMobileTab("canvas");
            }}
          />
        </div>

        {/* Center Column (Canvas) */}
        <div
          className={`${
            mobileTab === "canvas" ? "flex flex-1 w-full" : "hidden"
          } lg:flex lg:flex-1 overflow-hidden`}
        >
          <CenterCanvas
            form={form}
            question={selectedQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenDesignModal={() => setIsDesignModalOpen(true)}
            onOpenPreview={() => setIsPreviewOpen(true)}
            isSaving={isSaving}
            isEndingsSelected={isEndingsSelected}
            onUpdateEndings={handleUpdateEndings}
            isWelcomeSelected={isWelcomeSelected}
            onUpdateWelcome={handleUpdateWelcome}
          />
        </div>

        {/* Right Column (~300px) */}
        <div
          className={`${
            mobileTab === "settings" ? "flex flex-1 w-full" : "hidden"
          } lg:flex lg:w-[300px] lg:shrink-0 overflow-hidden`}
        >
          <RightSettingsPanel
            question={selectedQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onUpdateOptions={handleUpdateOptions}
            onChangeType={handleChangeType}
          />
        </div>
      </div>

      {/* Add Content Modal (ref-13) */}
      <AddContentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelectType={handleAddQuestion}
        onEnableWelcomeScreen={() => {
          updateFormMutation.mutate({
            welcome_screen: {
              enabled: true,
              title: "Welcome",
              button_text: "Start",
            },
          });
          setIsWelcomeSelected(true);
          setIsEndingsSelected(false);
          setSelectedQuestionId(null);
        }}
        onEnableEndingScreen={() => {
          setIsEndingsSelected(true);
          setIsWelcomeSelected(false);
          setSelectedQuestionId(null);
        }}
      />

      {/* Design / Theme Modal */}
      <DesignModal
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        currentTheme={form.theme}
        onSaveTheme={handleSaveTheme}
      />

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

      {/* Full Preview Modal (uses pure FormRunner with mode="preview") */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <FormRunner
            form={form}
            mode="preview"
            onClosePreview={() => setIsPreviewOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
