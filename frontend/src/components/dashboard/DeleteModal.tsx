"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormListItem } from "@/lib/types";
import { useDeleteForm } from "@/hooks/useForms";

interface DeleteModalProps {
  form: FormListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteModal({ form, isOpen, onClose }: DeleteModalProps) {
  const deleteMutation = useDeleteForm();

  if (!form) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(form.id);
      onClose();
    } catch {
      // Error handled in hook toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete form?"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-1">
        {/* Warning Icon & Details */}
        <div className="flex items-start gap-3 p-3.5 bg-[var(--accent-error-bg)] border border-[var(--accent-error)]/30 rounded-[12px] text-[var(--accent-error)]">
          <AlertTriangle className="w-5 h-5 text-[var(--accent-error)] shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">
              This action cannot be undone.
            </p>
            <p className="text-xs opacity-90 leading-relaxed">
              Deleting <strong className="font-semibold">&quot;{form.title}&quot;</strong> will permanently remove all questions, logic settings, and{" "}
              <strong>{form.response_count}</strong> submitted responses from the database.
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          Are you sure you want to proceed with deleting this form?
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            Delete permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
}
