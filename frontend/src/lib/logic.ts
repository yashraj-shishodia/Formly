import { LogicOperator, QuestionLogicRule, QuestionType } from "./types";
import { RawAnswerValue } from "./validators";

export const LOGIC_SUPPORTED_TYPES = new Set<QuestionType>([
  "multiple_choice",
  "dropdown",
  "yes_no",
  "number",
  "rating",
]);

export const ALLOWED_OPERATORS_BY_TYPE: Record<string, { label: string; value: LogicOperator }[]> = {
  multiple_choice: [
    { label: "is equal to", value: "equals" },
    { label: "is not equal to", value: "not_equals" },
  ],
  dropdown: [
    { label: "is equal to", value: "equals" },
    { label: "is not equal to", value: "not_equals" },
  ],
  yes_no: [
    { label: "is equal to", value: "equals" },
    { label: "is not equal to", value: "not_equals" },
  ],
  number: [
    { label: "is equal to", value: "equals" },
    { label: "is greater than", value: "greater_than" },
    { label: "is less than", value: "less_than" },
  ],
  rating: [
    { label: "is equal to", value: "equals" },
    { label: "is greater than", value: "greater_than" },
    { label: "is less than", value: "less_than" },
  ],
};

function normalizeBoolean(val: unknown): boolean | null {
  if (typeof val === "boolean") return val;
  if (val === null || val === undefined) return null;
  const s = String(val).trim().toLowerCase();
  if (["true", "yes", "1"].includes(s)) return true;
  if (["false", "no", "0"].includes(s)) return false;
  return null;
}

export function isRuleSatisfied(
  operator: LogicOperator,
  ruleValue: string,
  answerValue: RawAnswerValue,
  questionType: QuestionType
): boolean {
  if (answerValue === undefined || answerValue === null || answerValue === "") {
    return false;
  }

  // 1. Multiple Choice & Dropdown
  if (questionType === "multiple_choice" || questionType === "dropdown") {
    const target = String(ruleValue).trim().toLowerCase();
    if (Array.isArray(answerValue)) {
      const items = answerValue.map((x) => String(x).trim().toLowerCase());
      if (operator === "equals") return items.includes(target);
      if (operator === "not_equals") return !items.includes(target);
    } else {
      const ansStr = String(answerValue).trim().toLowerCase();
      if (operator === "equals") return ansStr === target;
      if (operator === "not_equals") return ansStr !== target;
    }
    return false;
  }

  // 2. Yes / No
  if (questionType === "yes_no") {
    const ansBool = normalizeBoolean(answerValue);
    const ruleBool = normalizeBoolean(ruleValue);
    if (ansBool === null || ruleBool === null) return false;
    if (operator === "equals") return ansBool === ruleBool;
    if (operator === "not_equals") return ansBool !== ruleBool;
    return false;
  }

  // 3. Number & Rating
  if (questionType === "number" || questionType === "rating") {
    const ansNum = Number(answerValue);
    const ruleNum = Number(ruleValue);
    if (isNaN(ansNum) || isNaN(ruleNum)) return false;
    if (operator === "equals") return ansNum === ruleNum;
    if (operator === "greater_than") return ansNum > ruleNum;
    if (operator === "less_than") return ansNum < ruleNum;
    return false;
  }

  return false;
}

export function findMatchingRule(
  question: { type: QuestionType; logic_rules?: QuestionLogicRule[] },
  answerValue: RawAnswerValue
): QuestionLogicRule | null {
  if (!question.logic_rules || question.logic_rules.length === 0) return null;
  const sortedRules = [...question.logic_rules].sort((a, b) => a.position - b.position);
  for (const rule of sortedRules) {
    if (isRuleSatisfied(rule.operator, rule.value, answerValue, question.type)) {
      return rule;
    }
  }
  return null;
}
