"use client";

import React, { useState, use, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useForm,
  useAddQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useReorderQuestions,
  useUpdateForm,
  usePublishForm,
} from "@/hooks/useForms";
import { Question, QuestionType, ThemeConfig, FormDetail } from "@/lib/types";
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

  const queryClient = useQueryClient();
  const { data: form, isLoading, isError, refetch } = useForm(formId);

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

  // Separate refs for debounced autosave per question and per section
  const pendingUpdatesRef = useRef<Record<number, Partial<Question>>>({});
  const questionTimersRef = useRef<Record<number, NodeJS.Timeout>>({});
  const endingsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const welcomeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    const qTimers = questionTimersRef.current;
    return () => {
      Object.values(qTimers).forEach((t) => clearTimeout(t));
      if (endingsTimerRef.current) clearTimeout(endingsTimerRef.current);
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    };
  }, []);

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
      <div className="min-h-screen bg-[var(--surface-page)] flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Form not found</h2>
        <p className="text-xs text-[var(--text-secondary)]">
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

  // Inline question update with debounced autosave and optimistic cache update
  const handleUpdateQuestion = (fields: Partial<Question>) => {
    if (!selectedQuestion) return;
    const qId = selectedQuestion.id;

    // 1. Immediately update local query cache so UI reflects changes without lag
    queryClient.setQueryData(["forms", formId], (old: FormDetail | undefined) => {
      if (!old) return old;
      return {
        ...old,
        questions: old.questions.map((q) =>
          q.id === qId ? { ...q, ...fields } : q
        ),
      };
    });

    // 2. Accumulate updates for network payload
    pendingUpdatesRef.current[qId] = {
      ...(pendingUpdatesRef.current[qId] || {}),
      ...fields,
    };

    // 3. Debounce network PATCH (350ms)
    if (questionTimersRef.current[qId]) {
      clearTimeout(questionTimersRef.current[qId]);
    }

    questionTimersRef.current[qId] = setTimeout(() => {
      const pendingData = pendingUpdatesRef.current[qId];
      delete pendingUpdatesRef.current[qId];
      delete questionTimersRef.current[qId];

      if (pendingData) {
        updateQuestionMutation.mutate({
          questionId: qId,
          data: {
            title: pendingData.title,
            description: pendingData.description,
            required: pendingData.required,
            settings_json: pendingData.settings_json,
          },
        });
      }
    }, 350);
  };

  // Change question type (clears options when moving away from choice types)
  const handleChangeType = (type: QuestionType) => {
    if (!selectedQuestion) return;
    const qId = selectedQuestion.id;
    const isChoice = type === "multiple_choice" || type === "dropdown";
    const currentIsChoice =
      selectedQuestion.type === "multiple_choice" ||
      selectedQuestion.type === "dropdown";

    let nextOptions: Array<{ label: string; position: number }> | undefined = undefined;
    if (isChoice) {
      if (selectedQuestion.options.length === 0) {
        nextOptions = [
          { label: "Option 1", position: 0 },
          { label: "Option 2", position: 1 },
        ];
      }
    } else if (currentIsChoice) {
      // Switching from choice type to non-choice type: clear options!
      nextOptions = [];
    }

    if (questionTimersRef.current[qId]) {
      clearTimeout(questionTimersRef.current[qId]);
      delete questionTimersRef.current[qId];
    }
    delete pendingUpdatesRef.current[qId];

    // Optimistically update cache
    queryClient.setQueryData(["forms", formId], (old: FormDetail | undefined) => {
      if (!old) return old;
      return {
        ...old,
        questions: old.questions.map((q) =>
          q.id === qId
            ? {
                ...q,
                type,
                options: nextOptions !== undefined
                  ? nextOptions.map((o, idx) => ({ id: -(idx + 1), question_id: qId, label: o.label, position: o.position }))
                  : q.options,
              }
            : q
        ),
      };
    });

    updateQuestionMutation.mutate({
      questionId: qId,
      data: {
        type,
        options: nextOptions,
      },
    });
  };

  // Options update for multiple choice / dropdown
  const handleUpdateOptions = (options: Array<{ label: string; position: number }>) => {
    if (!selectedQuestion) return;
    const qId = selectedQuestion.id;

    // Optimistically update query cache
    queryClient.setQueryData(["forms", formId], (old: FormDetail | undefined) => {
      if (!old) return old;
      return {
        ...old,
        questions: old.questions.map((q) =>
          q.id === qId
            ? {
                ...q,
                options: options.map((o, idx) => ({ id: -(idx + 1), question_id: qId, label: o.label, position: o.position })),
              }
            : q
        ),
      };
    });

    updateQuestionMutation.mutate({
      questionId: qId,
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
    queryClient.setQueryData(["forms", formId], (old: FormDetail | undefined) => {
      if (!old) return old;
      return {
        ...old,
        thank_you_title: title,
        thank_you_message: message,
      };
    });

    if (endingsTimerRef.current) clearTimeout(endingsTimerRef.current);
    endingsTimerRef.current = setTimeout(() => {
      updateFormMutation.mutate({
        thank_you_title: title,
        thank_you_message: message,
      });
    }, 400);
  };

  // Welcome screen update
  const handleUpdateWelcome = (title: string, description: string) => {
    queryClient.setQueryData(["forms", formId], (old: FormDetail | undefined) => {
      if (!old) return old;
      return {
        ...old,
        welcome_screen: {
          enabled: true,
          title,
          description,
          button_text: old.welcome_screen?.button_text || "Start",
        },
      };
    });

    if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    welcomeTimerRef.current = setTimeout(() => {
      updateFormMutation.mutate({
        welcome_screen: {
          enabled: true,
          title,
          description,
          button_text: form?.welcome_screen?.button_text || "Start",
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
      <div className="lg:hidden flex border-b border-[var(--border)] bg-[var(--surface-inner)] px-4 py-2 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab("questions")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
            mobileTab === "questions"
              ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Questions ({sortedQuestions.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("canvas")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
            mobileTab === "canvas"
              ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Canvas
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("settings")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-colors ${
            mobileTab === "settings"
              ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Settings
        </button>
      </div>

      {/* Main 3-Column Layout (~16px gaps per DESIGN_SPEC §3) */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden bg-[var(--surface-page)]">
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
            allQuestions={sortedQuestions}
            onUpdateQuestion={handleUpdateQuestion}
            onUpdateOptions={handleUpdateOptions}
            onChangeType={handleChangeType}
            onRefreshForm={() => {
              refetch();
            }}
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
