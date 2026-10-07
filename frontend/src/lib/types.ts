/**
 * Formly Shared TypeScript Definitions
 * Strictly mirrors backend schemas (Pydantic v2)
 */

export type FormStatus = "draft" | "published";
export type ResponseStatus = "partial" | "completed";

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export interface ThemeConfig {
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  font: string;
}

export interface WelcomeScreenConfig {
  enabled: boolean;
  title: string;
  description?: string | null;
  button_text: string;
}

export interface EndingScreenConfig {
  title: string;
  description?: string | null;
  button_text?: string | null;
  button_url?: string | null;
}

export interface QuestionOption {
  id: number;
  question_id: number;
  label: string;
  position: number;
}

export interface QuestionOptionCreate {
  label: string;
  position?: number;
}

export interface Question {
  id: number;
  form_id: number;
  type: QuestionType;
  title: string;
  description?: string | null;
  required: boolean;
  position: number;
  settings_json?: string | null;
  options: QuestionOption[];
  created_at: string;
  updated_at: string;
}

export interface QuestionCreate {
  type: QuestionType;
  title?: string;
  description?: string;
  required?: boolean;
  position?: number;
  settings_json?: string;
  options?: QuestionOptionCreate[];
}

export interface QuestionUpdate {
  type?: QuestionType;
  title?: string;
  description?: string | null;
  required?: boolean;
  settings_json?: string | null;
  options?: QuestionOptionCreate[];
}

export interface FormListItem {
  id: number;
  title: string;
  slug?: string | null;
  status: FormStatus;
  response_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface FormDetail {
  id: number;
  user_id: number;
  title: string;
  slug?: string | null;
  status: FormStatus;
  theme_json?: string | null;
  welcome_screen_json?: string | null;
  thank_you_title?: string | null;
  thank_you_message?: string | null;
  theme?: ThemeConfig;
  welcome_screen?: WelcomeScreenConfig;
  ending_screen?: EndingScreenConfig;
  response_count: number;
  questions: Question[];
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface FormCreate {
  title?: string;
}

export interface FormUpdate {
  title?: string;
  theme_json?: string;
  welcome_screen_json?: string;
  thank_you_title?: string;
  thank_you_message?: string;
  theme?: ThemeConfig;
  welcome_screen?: WelcomeScreenConfig;
  ending_screen?: EndingScreenConfig;
}

export interface PublicQuestion {
  id: number;
  type: QuestionType;
  title: string;
  description?: string | null;
  required: boolean;
  position: number;
  settings_json?: string | null;
  options: QuestionOption[];
}

export interface PublicForm {
  id: number;
  title: string;
  slug: string;
  theme_json?: string | null;
  welcome_screen_json?: string | null;
  thank_you_title?: string | null;
  thank_you_message?: string | null;
  theme?: ThemeConfig;
  welcome_screen?: WelcomeScreenConfig;
  ending_screen?: EndingScreenConfig;
  questions: PublicQuestion[];
}

export interface AnswerSubmit {
  question_id: number;
  value_text?: string | null;
  value_number?: number | null;
  value_json?: string | null;
}

export interface ResponseSubmit {
  answers: AnswerSubmit[];
  started_at?: string;
}

export interface SubmitResult {
  status: string;
  response_id: number;
  thank_you_title: string;
  thank_you_message: string;
}

export interface ResponseListItem {
  id: number;
  form_id: number;
  status: ResponseStatus;
  started_at: string;
  submitted_at?: string | null;
  answers: Record<string, string | number | boolean | string[] | null>;
}

export interface ResponseListResponse {
  total: number;
  page: number;
  page_size: number;
  items: ResponseListItem[];
}

export interface ResponseDetail {
  id: number;
  form_id: number;
  status: ResponseStatus;
  started_at: string;
  submitted_at?: string | null;
  answers: {
    id: number;
    question_id: number;
    value_text?: string | null;
    value_number?: number | null;
    value_json?: string | null;
  }[];
}

export interface QuestionOptionStat {
  label: string;
  count: number;
  percentage: number;
}

export interface QuestionSummary {
  question_id: number;
  type: QuestionType;
  title: string;
  total_answers: number;
  option_stats?: QuestionOptionStat[] | null;
  average?: number | null;
  min_value?: number | null;
  max_value?: number | null;
  distribution?: Record<string, number> | null;
  recent_answers?: string[] | null;
  yes_count?: number | null;
  no_count?: number | null;
  yes_percentage?: number | null;
  no_percentage?: number | null;
}

export interface FormSummary {
  form_id: number;
  total_responses: number;
  completed_responses: number;
  partial_responses: number;
  completion_rate: number;
  average_duration_seconds?: number | null;
  questions: QuestionSummary[];
}
