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

    toast.info("Formly AI: Creating your form...", {
      description: cleanPrompt,
    });

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
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Top Header / Breadcrumb per DESIGN_SPEC §5 */}
      <header className="h-16 border-b border-[#E6E6E8] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-[#6B6570] hover:text-[#2B2530] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Workspace</span>
          </Link>
          <span className="text-[#D4D2D6]">/</span>
          <span className="text-sm font-semibold text-[#2B2530]">New form</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-8 h-8 rounded-full hover:bg-[#F5F5F5] flex items-center justify-center text-[#6B6570] transition-colors"
            title="Help & docs"
            onClick={() => toast.info("Help & documentation available in docs/")}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#D9D9DC] border border-[#C5C3C8] text-[#2B2530] font-bold text-xs flex items-center justify-center">
            YS
          </div>
        </div>
      </header>

      {/* Main Canvas Area: One big rounded gray panel (#F5F5F5) per DESIGN_SPEC §5 */}
      <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
        <div className="w-full max-w-4xl bg-[#F5F5F5] border border-[#E6E6E8] rounded-[24px] p-8 md:p-14 flex flex-col items-center text-center shadow-xs">
          {/* AI Header */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EAFB] border border-[#8E4FC0]/20 text-[#8E4FC0] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formly AI</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-normal text-[#2B2530] tracking-tight mb-8">
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
          <div className="w-full max-w-2xl my-8 border-t border-[#E6E6E8] flex items-center justify-center relative">
            <span className="bg-[#F5F5F5] px-4 text-xs font-medium text-[#A8A3AD] uppercase tracking-wider">
              Or start manually
            </span>
          </div>

          {/* Action Pills per DESIGN_SPEC §5 (ref-11) */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleStartFromScratch}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#EAEAEC] text-[#2B2530] text-sm font-semibold border border-[#E6E6E8] transition-all shadow-2xs hover:border-[#C5C3C8]"
            >
              <Layers className="w-4 h-4 text-[#2B2530]" />
              <span>Start from scratch</span>
            </button>

            <button
              type="button"
              onClick={() =>
                toast.info("CRM Sync integration is a placeholder (Coming Soon)")
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 hover:bg-white text-[#6B6570] text-sm font-medium border border-[#E6E6E8] transition-all"
            >
              <Database className="w-4 h-4 text-[#A8A3AD]" />
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
