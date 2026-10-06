import {
  FormCreate,
  FormDetail,
  FormListItem,
  FormSummary,
  FormUpdate,
  PublicForm,
  Question,
  QuestionCreate,
  QuestionUpdate,
  ResponseDetail,
  ResponseListResponse,
  ResponseSubmit,
  SubmitResult,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data: unknown;
  validationErrors?: Record<string, string>;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;

    if (
      status === 422 &&
      data &&
      typeof data === "object" &&
      "detail" in data
    ) {
      const detail = (data as { detail: unknown }).detail;
      if (
        detail &&
        typeof detail === "object" &&
        "errors" in detail &&
        typeof (detail as { errors: unknown }).errors === "object"
      ) {
        this.validationErrors = (
          detail as { errors: Record<string, string> }
        ).errors;
      }
    }
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    const message =
      typeof errorData === "object" &&
      errorData !== null &&
      "detail" in errorData &&
      typeof (errorData as { detail: unknown }).detail === "string"
        ? (errorData as { detail: string }).detail
        : `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Forms
  getForms: () => request<FormListItem[]>("/api/forms"),

  createForm: (payload: FormCreate) =>
    request<FormDetail>("/api/forms", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getForm: (id: number) => request<FormDetail>(`/api/forms/${id}`),

  updateForm: (id: number, payload: FormUpdate) => {
    const body: Record<string, unknown> = { ...payload };
    if (payload.theme && !payload.theme_json) {
      body.theme_json = JSON.stringify(payload.theme);
    }
    if (payload.welcome_screen && !payload.welcome_screen_json) {
      body.welcome_screen_json = JSON.stringify(payload.welcome_screen);
    }
    return request<FormDetail>(`/api/forms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  deleteForm: (id: number) =>
    request<{ message: string }>(`/api/forms/${id}`, {
      method: "DELETE",
    }),

  duplicateForm: (id: number) =>
    request<FormDetail>(`/api/forms/${id}/duplicate`, {
      method: "POST",
    }),

  publishForm: (id: number) =>
    request<FormDetail>(`/api/forms/${id}/publish`, {
      method: "POST",
    }),

  unpublishForm: (id: number) =>
    request<FormDetail>(`/api/forms/${id}/unpublish`, {
      method: "POST",
    }),

  // Questions
  addQuestion: (formId: number, payload: QuestionCreate) =>
    request<Question>(`/api/forms/${formId}/questions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateQuestion: (id: number, payload: QuestionUpdate) =>
    request<Question>(`/api/questions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteQuestion: (id: number) =>
    request<{ message: string }>(`/api/questions/${id}`, {
      method: "DELETE",
    }),

  reorderQuestions: (formId: number, questionIds: number[]) =>
    request<Question[]>(`/api/forms/${formId}/questions/order`, {
      method: "PUT",
      body: JSON.stringify({ question_ids: questionIds }),
    }),

  // Public Respondent Flow
  getPublicForm: (slug: string) => request<PublicForm>(`/api/public/forms/${slug}`),

  submitPublicResponse: (slug: string, payload: ResponseSubmit) =>
    request<SubmitResult>(`/api/public/forms/${slug}/responses`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Responses & Analytics
  getFormResponses: (formId: number, page: number = 1, pageSize: number = 20) =>
    request<ResponseListResponse>(
      `/api/forms/${formId}/responses?page=${page}&page_size=${pageSize}`
    ),

  getSingleResponse: (responseId: number) =>
    request<ResponseDetail>(`/api/responses/${responseId}`),

  deleteResponse: (responseId: number) =>
    request<{ message: string }>(`/api/responses/${responseId}`, {
      method: "DELETE",
    }),

  getFormSummary: (formId: number) =>
    request<FormSummary>(`/api/forms/${formId}/summary`),

  getCsvExportUrl: (formId: number) =>
    `${API_BASE}/api/forms/${formId}/responses/export.csv`,
};
