"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import {
  FormCreate,
  FormUpdate,
  QuestionCreate,
  QuestionUpdate,
  ResponseSubmit,
} from "@/lib/types";

// ==========================================
// Form Hooks
// ==========================================

export function useForms() {
  return useQuery({
    queryKey: ["forms"],
    queryFn: () => api.getForms(),
  });
}

export function useForm(formId: number) {
  return useQuery({
    queryKey: ["forms", formId],
    queryFn: () => api.getForm(formId),
    enabled: !isNaN(formId) && formId > 0,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormCreate) => api.createForm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form created successfully");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to create form");
    },
  });
}

export function useUpdateForm(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormUpdate) => api.updateForm(formId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["forms", formId], updated);
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to save form");
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formId: number) => api.deleteForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form deleted");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to delete form");
    },
  });
}

export function useDuplicateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formId: number) => api.duplicateForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form duplicated");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to duplicate form");
    },
  });
}

export function usePublishForm(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.publishForm(formId),
    onSuccess: (updated) => {
      queryClient.setQueryData(["forms", formId], updated);
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form published!");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to publish form");
    },
  });
}

export function useUnpublishForm(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.unpublishForm(formId),
    onSuccess: (updated) => {
      queryClient.setQueryData(["forms", formId], updated);
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form unpublished (draft mode)");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to unpublish form");
    },
  });
}

// ==========================================
// Question Hooks
// ==========================================

export function useAddQuestion(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: QuestionCreate) => api.addQuestion(formId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", formId] });
      toast.success("Question added");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to add question");
    },
  });
}

export function useUpdateQuestion(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: number; data: QuestionUpdate }) =>
      api.updateQuestion(questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", formId] });
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to update question");
    },
  });
}

export function useDeleteQuestion(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: number) => api.deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", formId] });
      toast.success("Question removed");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to remove question");
    },
  });
}

export function useReorderQuestions(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionIds: number[]) => api.reorderQuestions(formId, questionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", formId] });
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to update order");
    },
  });
}

// ==========================================
// Public Flow Hooks
// ==========================================

export function usePublicForm(slug: string) {
  return useQuery({
    queryKey: ["public-form", slug],
    queryFn: () => api.getPublicForm(slug),
    enabled: Boolean(slug),
    retry: false,
  });
}

export function useSubmitPublicResponse(slug: string) {
  return useMutation({
    mutationFn: (data: ResponseSubmit) => api.submitPublicResponse(slug, data),
  });
}

// ==========================================
// Responses & Summary Hooks
// ==========================================

export function useFormResponses(formId: number, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ["responses", formId, page, pageSize],
    queryFn: () => api.getFormResponses(formId, page, pageSize),
    enabled: !isNaN(formId) && formId > 0,
  });
}

export function useFormSummary(formId: number) {
  return useQuery({
    queryKey: ["summary", formId],
    queryFn: () => api.getFormSummary(formId),
    enabled: !isNaN(formId) && formId > 0,
  });
}

export function useDeleteResponse(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (responseId: number) => api.deleteResponse(responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses", formId] });
      queryClient.invalidateQueries({ queryKey: ["summary", formId] });
      toast.success("Response deleted");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to delete response");
    },
  });
}
