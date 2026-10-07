"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Edit3,
  BarChart2,
  Share2,
  Copy,
  Trash2,
  Calendar,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { FormListItem } from "@/lib/types";

interface FormCardProps {
  form: FormListItem;
  onShare: (form: FormListItem) => void;
  onRename: (form: FormListItem) => void;
  onDuplicate: (form: FormListItem) => void;
  onDelete: (form: FormListItem) => void;
}

export function FormCard({
  form,
  onShare,
  onRename,
  onDuplicate,
  onDelete,
}: FormCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Format updated date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isPublished = form.status === "published";

  return (
    <div className="group relative bg-[var(--surface-card)] rounded-[16px] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all hover:shadow-xs flex flex-col justify-between p-5 min-h-[190px]">
      {/* Top Header: Status Badge + Action Menu */}
      <div className="flex items-center justify-between gap-2">
        {/* Status Badge */}
        {isPublished ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--accent-publish)]/10 text-[var(--accent-publish)] border border-[var(--accent-publish)]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-publish)]" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--surface-row)] text-[var(--text-secondary)] border border-[var(--border)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
            Draft
          </span>
        )}

        {/* 3-dots Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="w-8 h-8 rounded-[6px] hover:bg-[var(--surface-row)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors focus:outline-hidden"
            title="Form actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Action Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-9 w-48 bg-[var(--surface-popover)] rounded-[10px] border border-[var(--border)] shadow-lg py-1.5 z-20 text-[13px] animate-in fade-in-50 zoom-in-95 duration-100">
              <Link
                href={`/forms/${form.id}/edit`}
                className="flex items-center gap-2.5 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Edit3 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Edit form</span>
              </Link>

              <Link
                href={`/forms/${form.id}/results`}
                className="flex items-center gap-2.5 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <BarChart2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>View results</span>
              </Link>

              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-colors text-left"
                onClick={() => {
                  setMenuOpen(false);
                  onShare(form);
                }}
              >
                <Share2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Share link</span>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-colors text-left"
                onClick={() => {
                  setMenuOpen(false);
                  onRename(form);
                }}
              >
                <Edit3 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Rename</span>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-card-hover)] transition-colors text-left"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(form);
                }}
              >
                <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Duplicate</span>
              </button>

              <div className="h-px bg-[var(--border)] my-1" />

              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[var(--accent-error)] hover:bg-[var(--accent-error-bg)] transition-colors text-left"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(form);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 text-[var(--accent-error)]" />
                <span>Delete form</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Body: Title & Metadata */}
      <div className="mt-3 mb-4 space-y-2">
        <Link
          href={`/forms/${form.id}/edit`}
          className="block group/title text-[17px] font-semibold text-[var(--text-primary)] hover:text-[var(--accent-ai-border)] transition-colors line-clamp-2 leading-snug"
        >
          {form.title}
        </Link>

        {/* Response count & updated date */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5 font-medium">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            {form.response_count === 1
              ? "1 response"
              : `${form.response_count} responses`}
          </span>
          <span className="text-[var(--border-strong)]">•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            {formatDate(form.updated_at)}
          </span>
        </div>
      </div>

      {/* Footer Actions: Edit and Results buttons */}
      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/forms/${form.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--surface-row)] hover:bg-[var(--surface-row-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors"
          >
            <Edit3 className="w-3 h-3 text-[var(--text-secondary)]" />
            Edit
          </Link>

          <Link
            href={`/forms/${form.id}/results`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] hover:bg-[var(--surface-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors"
          >
            <BarChart2 className="w-3 h-3 text-[var(--text-secondary)]" />
            Results
          </Link>
        </div>

        {/* Quick share or live open */}
        {isPublished && form.slug ? (
          <Link
            href={`/f/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--accent-publish)] hover:underline font-medium"
            title="Open published form"
          >
            <span>Live</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onShare(form)}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium"
          >
            Publish
          </button>
        )}
      </div>
    </div>
  );
}
