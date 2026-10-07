"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Mic,
  Plus,
  MoreHorizontal,
  ArrowUp,
  HelpCircle,
  Layers,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { useCreateForm } from "@/hooks/useForms";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function NewFormPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const createMutation = useCreateForm();

  const handleStartFromScratch = async () => {
    try {
      const newForm = await createMutation.mutateAsync({
        title: "Untitled form",
      });
      router.push(`/forms/${newForm.id}/edit`);
    } catch {
      // Handled in mutation onError
    }
  };

  const handleAiSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      toast.info("Please describe what form you want to create");
      return;
    }

    toast.info("AI generation is a placeholder (Coming Soon). A blank form was created from your prompt.");

    try {
      const newForm = await createMutation.mutateAsync({
        title: cleanPrompt.slice(0, 60),
      });
      router.push(`/forms/${newForm.id}/edit`);
    } catch {
      // Handled in mutation onError
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-page)] flex flex-col font-sans">
      {/* Top Header / Breadcrumb per DESIGN_SPEC §5 */}
      <header className="h-16 border-b border-[var(--border)] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Workspace</span>
          </Link>
          <span className="text-[var(--border-strong)]">/</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">New form</span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:bg-[var(--surface-card)] flex items-center justify-center text-[var(--text-secondary)] transition-colors"
            title="Help & docs"
            onClick={() => toast.info("Help & documentation available in docs/")}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-[var(--surface-row)] border border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center">
            YS
          </div>
        </div>
      </header>

      {/* Main Canvas Area: One big rounded gray panel (#F5F5F5) per DESIGN_SPEC §5 */}
      <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
        <div className="w-full max-w-4xl bg-[var(--surface-card)] border border-[var(--border)] rounded-[24px] p-8 md:p-14 flex flex-col items-center text-center shadow-xs">
          {/* AI Header */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-ai-fill)] border border-[var(--accent-ai-border)]/20 text-[var(--accent-ai-border)] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formly AI</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-normal text-[var(--text-primary)] tracking-tight mb-8">
            What would you like to create?
          </h1>

          {/* Glowing Lavender Textarea Box per DESIGN_SPEC §5 (ref-11) */}
          <form
            onSubmit={handleAiSubmit}
            className="w-full max-w-2xl relative rounded-[16px] bg-[#F3EAFB]/40 border-2 border-[#8E4FC0] shadow-sm p-4 text-left focus-within:ring-4 focus-within:ring-[#8E4FC0]/15 transition-all"
          >
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Formly AI to generate a contact form, employee feedback survey, lead magnet, or NPS questionnaire..."
              className="w-full bg-transparent resize-none border-none text-[#2B2530] placeholder-[#8E4FC0]/60 text-base focus:outline-hidden leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAiSubmit();
                }
              }}
            />

            {/* Bottom toolbar inside lavender box */}
            <div className="flex items-center justify-between pt-2 border-t border-[#8E4FC0]/20 mt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toast.info("Voice input coming soon")}
                  className="p-1.5 rounded-full hover:bg-[#8E4FC0]/10 text-[#8E4FC0] transition-colors"
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Attachments coming soon")}
                  className="p-1.5 rounded-full hover:bg-[#8E4FC0]/10 text-[#8E4FC0] transition-colors"
                  title="Attach file"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Advanced options coming soon")}
                  className="p-1.5 rounded-full hover:bg-[#8E4FC0]/10 text-[#8E4FC0] transition-colors"
                  title="More prompt options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending || !prompt.trim()}
                className="w-8 h-8 rounded-full bg-[#8E4FC0] text-white flex items-center justify-center hover:bg-[#7839A8] disabled:opacity-40 disabled:hover:bg-[#8E4FC0] transition-colors"
                title="Generate with AI"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="w-full max-w-2xl my-8 border-t border-[var(--border)] flex items-center justify-center relative">
            <span className="bg-[var(--surface-card)] px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Or start manually
            </span>
          </div>

          {/* Action Pills per DESIGN_SPEC §5 (ref-11) */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleStartFromScratch}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--surface-page)] hover:bg-[var(--surface-card-hover)] text-[var(--text-primary)] text-sm font-semibold border border-[var(--border)] transition-all shadow-2xs hover:border-[var(--border-strong)]"
            >
              <Layers className="w-4 h-4 text-[var(--text-primary)]" />
              <span>Start from scratch</span>
            </button>

            <button
              type="button"
              onClick={() =>
                toast.info("CRM Sync integration is a placeholder (Coming Soon)")
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--surface-page)]/70 hover:bg-[var(--surface-page)] text-[var(--text-secondary)] text-sm font-medium border border-[var(--border)] transition-all"
            >
              <Database className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Sync to CRM</span>
              <span className="text-[10px] font-medium text-[#2F7D69] bg-[#E6F4EA] px-1.5 py-0.5 rounded-[4px] border border-[#2F7D69]/20">
                Soon
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
