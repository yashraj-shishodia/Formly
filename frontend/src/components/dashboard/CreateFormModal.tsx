"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useCreateForm } from "@/hooks/useForms";
import { toast } from "sonner";

interface CreateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateFormModal({ isOpen, onClose }: CreateFormModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const createMutation = useCreateForm();

  const handleCreateScratch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalTitle = title.trim() || "Untitled form";
    try {
      const newForm = await createMutation.mutateAsync({
        title: finalTitle,
      });
      onClose();
      router.push(`/forms/${newForm.id}/edit`);
    } catch {
      // Handled in mutation onError
    }
  };

  const handleCreateWithAi = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      toast.info("Please enter a description for the AI form");
      return;
    }
    toast.info("Formly AI: Creating form from your prompt...", {
      description: prompt,
    });
    try {
      const newForm = await createMutation.mutateAsync({
        title: prompt.slice(0, 50),
      });
      onClose();
      router.push(`/forms/${newForm.id}/edit`);
    } catch {
      // Handled in mutation onError
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a new form"
      description="Choose how you'd like to get started with your form."
      maxWidth="max-w-xl"
    >
      <div className="space-y-5 pt-2">
        {/* Option 1: Start with Title */}
        <form onSubmit={handleCreateScratch} className="space-y-3">
          <div>
            <label
              htmlFor="create-title"
              className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2"
            >
              Form Title
            </label>
            <div className="flex gap-2">
              <input
                id="create-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Customer Satisfaction Survey"
                className="flex-1 px-3.5 py-2.5 bg-[var(--surface-page)] border border-[var(--border)] rounded-[8px] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--primary)]"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={createMutation.isPending}
                className="shrink-0 gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Start blank</span>
              </Button>
            </div>
          </div>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[var(--border)]" />
          <span className="bg-[var(--surface-page)] px-3 text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold absolute">
            or create with AI
          </span>
        </div>

        {/* Option 2: AI Prompt Card per DESIGN_SPEC (lavender glow) */}
        <div className="p-4 rounded-[14px] bg-[var(--accent-ai-fill)] border border-[var(--accent-ai-border)]/30 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-ai-border)]" />
            <span className="text-xs font-bold text-[var(--accent-ai-border)] uppercase tracking-wider">
              Formly AI Generator
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Describe what you need (e.g. &quot;Post-event attendee survey with rating and feedback&quot;).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="What questions would you like to ask?"
              className="flex-1 px-3.5 py-2 bg-[var(--surface-page)] border border-[var(--accent-ai-border)]/30 rounded-[8px] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-ai-border)]"
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleCreateWithAi}
              isLoading={createMutation.isPending}
              className="shrink-0 gap-1.5 text-[var(--accent-ai-border)] hover:bg-[var(--accent-ai-fill)] border-[var(--accent-ai-border)]/30"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent-ai-border)]" />
              <span>Generate</span>
            </Button>
          </div>
        </div>

        {/* Footer: Close and Fullscreen link */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/forms/new");
            }}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 font-medium"
          >
            <span>Open full screen creation page</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
