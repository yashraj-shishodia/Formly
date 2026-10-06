import { Question, PublicQuestion, AnswerSubmit } from "./types";

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

export type RawAnswerValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

/**
 * Checks whether an answer is considered empty/unanswered
 */
export function isAnswerEmpty(val: RawAnswerValue): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") return val.trim().length === 0;
  if (typeof val === "number") return isNaN(val);
  if (typeof val === "boolean") return false;
  if (Array.isArray(val)) return val.length === 0;
  return false;
}

/**
 * Validates an answer value against a question's requirements and settings.
 * Returns null if valid, or a user-facing error message if invalid.
 */
export function validateQuestionAnswer(
  question: Question | PublicQuestion,
  value: RawAnswerValue
): string | null {
  const empty = isAnswerEmpty(value);

  // 1. Required check
  if (question.required && empty) {
    return "This question is required.";
  }

  // If optional and unanswered, valid
  if (empty) {
    return null;
  }

  // Parse settings
  let settings: Record<string, unknown> = {};
  if (question.settings_json) {
    try {
      settings = JSON.parse(question.settings_json);
    } catch {
      settings = {};
    }
  }

  // 2. Type-specific checks
  switch (question.type) {
    case "short_text": {
      const text = String(value || "");
      const maxLength = typeof settings.max_length === "number" ? settings.max_length : 255;
      if (text.length > maxLength) {
        return `Answer cannot exceed ${maxLength} characters.`;
      }
      return null;
    }

    case "long_text": {
      const text = String(value || "");
      const maxLength = typeof settings.max_length === "number" ? settings.max_length : 5000;
      if (text.length > maxLength) {
        return `Answer cannot exceed ${maxLength} characters.`;
      }
      return null;
    }

    case "email": {
      const text = String(value || "").trim();
      if (!EMAIL_REGEX.test(text)) {
        return "Please enter a valid email address.";
      }
      return null;
    }

    case "number": {
      const num = typeof value === "number" ? value : Number(value);
      if (isNaN(num)) {
        return "Please enter a valid number.";
      }
      const minVal = settings.min_value !== undefined ? Number(settings.min_value) : null;
      const maxVal = settings.max_value !== undefined ? Number(settings.max_value) : null;
      if (minVal !== null && !isNaN(minVal) && num < minVal) {
        return `Value must be at least ${minVal}.`;
      }
      if (maxVal !== null && !isNaN(maxVal) && num > maxVal) {
        return `Value must be at most ${maxVal}.`;
      }
      return null;
    }

    case "rating": {
      const num = typeof value === "number" ? value : Number(value);
      if (isNaN(num) || num < 1) {
        return "Please provide a rating.";
      }
      const maxRating = typeof settings.max_rating === "number" ? settings.max_rating : 5;
      if (num > maxRating) {
        return `Rating must be between 1 and ${maxRating}.`;
      }
      return null;
    }

    case "yes_no": {
      if (value === null || value === undefined || value === "") {
        return "Please select Yes or No.";
      }
      return null;
    }

    case "multiple_choice":
    case "dropdown": {
      const validLabels = new Set(question.options.map((o) => o.label));
      if (validLabels.size === 0) return null;

      let chosen: string[] = [];
      if (Array.isArray(value)) {
        chosen = value.map(String);
      } else if (typeof value === "string" && value.trim()) {
        chosen = [value.trim()];
      }

      if (chosen.length === 0) {
        return "Please select an option.";
      }

      for (const item of chosen) {
        if (!validLabels.has(item)) {
          return `'${item}' is not a valid option.`;
        }
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Formats a raw answer into an AnswerSubmit payload for the API
 */
export function formatAnswerPayload(
  question: Question | PublicQuestion,
  value: RawAnswerValue
): AnswerSubmit {
  if (value === null || value === undefined || value === "") {
    return {
      question_id: question.id,
      value_text: null,
      value_number: null,
      value_json: null,
    };
  }

  switch (question.type) {
    case "short_text":
    case "long_text":
    case "email":
      return {
        question_id: question.id,
        value_text: String(value),
        value_number: null,
        value_json: null,
      };

    case "number":
    case "rating": {
      const num = typeof value === "number" ? value : Number(value);
      return {
        question_id: question.id,
        value_text: String(num),
        value_number: isNaN(num) ? null : num,
        value_json: null,
      };
    }

    case "yes_no": {
      const boolVal =
        typeof value === "boolean"
          ? value
          : String(value).toLowerCase() === "yes" || String(value).toLowerCase() === "true";
      return {
        question_id: question.id,
        value_text: boolVal ? "Yes" : "No",
        value_number: null,
        value_json: JSON.stringify(boolVal),
      };
    }

    case "multiple_choice":
    case "dropdown": {
      if (Array.isArray(value)) {
        return {
          question_id: question.id,
          value_text: value.join(", "),
          value_number: null,
          value_json: JSON.stringify(value),
        };
      }
      return {
        question_id: question.id,
        value_text: String(value),
        value_number: null,
        value_json: JSON.stringify([String(value)]),
      };
    }

    default:
      return {
        question_id: question.id,
        value_text: String(value),
        value_number: null,
        value_json: null,
      };
  }
}
