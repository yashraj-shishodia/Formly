"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormListItem } from "@/lib/types";
import { useUpdateForm } from "@/hooks/useForms";
import { toast } from "sonner";

interface RenameModalProps {
  form: FormListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RenameModal({ form, isOpen, onClose }: RenameModalProps) {
  const [title, setTitle] = useState(form?.title || "");
  const updateMutation = useUpdateForm(form?.id ?? 0);

  useEffect(() => {
    if (form) {
      setTitle((prev) => (prev === form.title ? prev : form.title));
    }
  }, [form]);

  if (!form) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Form title cannot be empty");
      return;
    }

    try {
      await updateMutation.mutateAsync({ title: trimmed });
      toast.success("Form renamed successfully");
      onClose();
    } catch {
      // Handled in mutation onError
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename form"
      description="Enter a new title for this form."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label
            htmlFor="form-title"
            className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2"
          >
            Form Title
          </label>
          <input
            id="form-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Customer Satisfaction Survey"
            autoFocus
            className="w-full px-3.5 py-2.5 bg-[var(--surface-page)] border border-[var(--border)] rounded-[8px] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={updateMutation.isPending}
          >
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
