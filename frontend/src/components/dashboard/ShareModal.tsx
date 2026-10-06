"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Copy, Check, ExternalLink, Globe2, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormListItem } from "@/lib/types";
import { usePublishForm, useUnpublishForm } from "@/hooks/useForms";

interface ShareModalProps {
  form: FormListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ form, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const publishMutation = usePublishForm(form?.id ?? 0);
  const unpublishMutation = useUnpublishForm(form?.id ?? 0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!form) return null;

  const isPublished = form.status === "published";
  const publicUrl = form.slug ? `${origin}/f/${form.slug}` : "";

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleTogglePublish = async () => {
    if (isPublished) {
      await unpublishMutation.mutateAsync();
    } else {
      await publishMutation.mutateAsync();
    }
  };

  const isPending = publishMutation.isPending || unpublishMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share your form"
      description={`Manage publication and distribution for "${form.title}"`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6 pt-2">
        {/* Publication Status Card */}
        <div className="p-4 rounded-[12px] bg-[#F5F5F5] border border-[#E6E6E8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isPublished
                  ? "bg-[#E6F4EA] text-[#2F7D69]"
                  : "bg-[#EAEAEC] text-[#6B6570]"
              }`}
            >
              {isPublished ? (
                <Globe2 className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#2B2530]">
                  {isPublished ? "Published" : "Draft (Unpublished)"}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] ${
                    isPublished
                      ? "bg-[#E6F4EA] text-[#2F7D69]"
                      : "bg-[#EAEAEC] text-[#6B6570]"
                  }`}
                >
                  {isPublished ? "Live" : "Draft"}
                </span>
              </div>
              <p className="text-xs text-[#6B6570] mt-0.5">
                {isPublished
                  ? "Anyone with the link can view and submit responses."
                  : "This form cannot receive public responses."}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isPublished}
            disabled={isPending}
            onClick={handleTogglePublish}
            className={`w-11 h-6 rounded-full transition-colors relative focus:outline-hidden disabled:opacity-50 ${
              isPublished ? "bg-[#2F7D69]" : "bg-[#D4D2D6]"
            }`}
          >
            <span
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                isPublished ? "left-5.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Public Link Section (when published) */}
        {isPublished && publicUrl && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#6B6570] uppercase tracking-wider block">
              Shareable Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-3.5 py-2.5 bg-white border border-[#E6E6E8] rounded-[8px] text-sm text-[#2B2530] font-mono focus:outline-hidden focus:border-[#2B2530]"
              />
              <Button
                variant={copied ? "secondary" : "primary"}
                size="md"
                onClick={handleCopy}
                className="gap-2 shrink-0 min-w-[110px]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#2F7D69]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-[#6B6570]">
              <span>Slug: <code className="font-mono bg-[#F5F5F5] px-1 py-0.5 rounded">{form.slug}</code></span>
              <Link
                href={`/f/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#2F7D69] hover:underline font-medium"
              >
                <span>Open in new tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Action button if draft */}
        {!isPublished && (
          <div className="text-center py-2 space-y-3">
            <p className="text-xs text-[#6B6570]">
              To start collecting responses, publish this form to generate a unique public link.
            </p>
            <Button
              variant="publish"
              size="md"
              onClick={handleTogglePublish}
              isLoading={isPending}
              className="w-full"
            >
              Publish Now
            </Button>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-[#E6E6E8]">
          <Button variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
