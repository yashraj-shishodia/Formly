"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Globe2,
  HelpCircle,
  BarChart2,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FormDetail } from "@/lib/types";
import { toast } from "sonner";

interface BuilderHeaderProps {
  form: FormDetail;
  onUpdateTitle: (newTitle: string) => void;
  onOpenShareModal: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

export function BuilderHeader({
  form,
  onUpdateTitle,
  onOpenShareModal,
  onPublish,
  isPublishing = false,
}: BuilderHeaderProps) {
  const [title, setTitle] = useState(form.title);
  const [activeTab, setActiveTab] = useState<"content" | "workflow" | "connect">("content");

  useEffect(() => {
    setTitle(form.title);
  }, [form.title]);

  const handleBlur = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== form.title) {
      onUpdateTitle(trimmed);
    } else {
      setTitle(form.title);
    }
  };

  const isPublished = form.status === "published";

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--surface-page)] px-4 md:px-6 flex items-center justify-between select-none relative z-20">
      {/* Left: Breadcrumbs & Inline Title Editing */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-[6px] hover:bg-[var(--surface-card-hover)] shrink-0"
          title="Back to Workspace"
          aria-label="Back to forms"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Forms</span>
        </Link>

        <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] bg-transparent border border-transparent hover:border-[var(--border-strong)] focus:border-[var(--primary)] px-1.5 sm:px-2 py-1 rounded-[6px] focus:outline-hidden transition-all truncate max-w-[120px] sm:max-w-[200px] md:max-w-[260px]"
          title="Click to rename form"
          aria-label="Form title"
        />
      </div>

      {/* Center: Tabs Content | Workflow | Connect (with top-edge indicator line, desktop only) */}
      <div className="hidden md:flex items-center gap-8 h-full">
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`h-full flex items-center px-2 text-sm font-medium relative transition-colors ${
            activeTab === "content"
              ? "text-[var(--text-primary)] font-semibold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {/* Top-edge indicator line per DESIGN_SPEC §3 */}
          {activeTab === "content" && (
            <span
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: "var(--primary)" }}
            />
          )}
          <span>Content</span>
        </button>

        <button
          type="button"
          onClick={() => toast.info("Workflow logic builder is a placeholder (Coming Soon)")}
          className="h-full flex items-center gap-1.5 px-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <span>Workflow</span>
          <span className="text-[10px] text-[var(--accent-publish)] bg-[var(--accent-publish)]/10 px-1 py-0.5 rounded-[4px]">
            Soon
          </span>
        </button>

        <button
          type="button"
          onClick={() => toast.info("Integrations & webhooks are a placeholder (Coming Soon)")}
          className="h-full flex items-center gap-1.5 px-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <span>Connect</span>
          <span className="text-[10px] text-[var(--accent-publish)] bg-[var(--accent-publish)]/10 px-1 py-0.5 rounded-[4px]">
            Soon
          </span>
        </button>
      </div>

      {/* Right: Results, Share, Publish, ThemeToggle, Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Results Link */}
        <Link href={`/forms/${form.id}/results`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-medium px-2 sm:px-3.5" title="Results">
            <BarChart2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="hidden sm:inline">Results</span>
          </Button>
        </Link>

        {/* Share Button */}
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

        <div className="w-px h-5 bg-[var(--border)] mx-0.5" />

        {/* Muted Green Publish Button per DESIGN_SPEC §1 (#2F7D69) */}
        <Button
          variant={isPublished ? "secondary" : "publish"}
          size="sm"
          onClick={isPublished ? onOpenShareModal : onPublish}
          isLoading={isPublishing}
          className="gap-1.5 text-xs font-semibold"
        >
          {isPublished ? (
            <>
              <Check className="w-3.5 h-3.5 text-[var(--accent-publish)]" />
              <span className="text-[var(--accent-publish)]">Published</span>
            </>
          ) : (
            <>
              <Globe2 className="w-3.5 h-3.5" />
              <span>Publish</span>
            </>
          )}
        </Button>

        {/* Dark Mode Toggle */}
        <ThemeToggle />

        {/* Help icon */}
        <button
          type="button"
          onClick={() => toast.info("Builder keyboard shortcuts: Enter to add line, click canvas to edit title/description")}
          className="w-8 h-8 rounded-full hover:bg-[var(--surface-card-hover)] flex items-center justify-center text-[var(--text-secondary)] transition-colors"
          title="Help & Shortcuts"
          aria-label="Help & Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User round avatar */}
        <div className="w-8 h-8 rounded-full bg-[var(--surface-row)] border border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center">
          YS
        </div>
      </div>
    </header>
  );
}
