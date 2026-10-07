"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PublicForm, FormDetail, Question, PublicQuestion } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import {
  validateQuestionAnswer,
  formatAnswerPayload,
  RawAnswerValue,
} from "@/lib/validators";
import { resolveThemeFontCss } from "@/lib/tokens";
import { findMatchingRule } from "@/lib/logic";
import { QuestionShell } from "./QuestionShell";
import { WelcomeScreen } from "./WelcomeScreen";
import { ThankYouScreen } from "./ThankYouScreen";
import { ShortTextInput } from "./inputs/ShortTextInput";
import { LongTextInput } from "./inputs/LongTextInput";
import { MultipleChoiceInput } from "./inputs/MultipleChoiceInput";
import { YesNoInput } from "./inputs/YesNoInput";
import { EmailInput } from "./inputs/EmailInput";
import { NumberInput } from "./inputs/NumberInput";
import { RatingInput } from "./inputs/RatingInput";
import { DropdownInput } from "./inputs/DropdownInput";
import { FileUploadInput } from "./inputs/FileUploadInput";

interface FormRunnerProps {
  form: PublicForm | FormDetail;
  mode?: "live" | "preview";
  onClosePreview?: () => void;
}

export function FormRunner({
  form,
  mode = "live",
  onClosePreview,
}: FormRunnerProps) {
  const questions: (Question | PublicQuestion)[] = useMemo(() => {
    return [...(form.questions || [])].sort((a, b) => a.position - b.position);
  }, [form.questions]);

  const hasWelcomeScreen = !!form.welcome_screen?.enabled;

  // State
  const [screen, setScreen] = useState<"welcome" | "question" | "thankyou">(
    hasWelcomeScreen ? "welcome" : "question"
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([0]);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<number, RawAnswerValue>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseId, setResponseId] = useState<number | null>(null);
  const responseIdRef = useRef<number | null>(null);
  const lastSavedAnswersRef = useRef<Record<number, string>>({});
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
  }, []);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Active answer value
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentError = currentQuestion ? errors[currentQuestion.id] : null;

  // Evaluate matching rule for current question & answer
  const matchingRule = useMemo(() => {
    if (!currentQuestion) return null;
    return findMatchingRule(currentQuestion, currentAnswer);
  }, [currentQuestion, currentAnswer]);

  const isJumpToEnd =
    matchingRule !== null &&
    (matchingRule.target_question_id === null || matchingRule.target_question_id === undefined);

  const isSubmitStep = isLastQuestion || isJumpToEnd;

  // Update answer for current question
  const handleAnswerChange = useCallback(
    (value: RawAnswerValue) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
      // Clear error on change
      if (errors[currentQuestion.id]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[currentQuestion.id];
          return next;
        });
      }
    },
    [currentQuestion, errors]
  );

  // Navigate forward with logic branching
  const goNext = useCallback(async () => {
    if (!currentQuestion) return;

    // Validate current question
    const err = validateQuestionAnswer(currentQuestion, currentAnswer);
    if (err) {
      setErrors((prev) => ({ ...prev, [currentQuestion.id]: err }));
      return;
    }

    // Track response progress in live mode
    if (mode === "live" && form.slug) {
      const hasAnswer =
        currentAnswer !== undefined &&
        currentAnswer !== null &&
        currentAnswer !== "" &&
        !(Array.isArray(currentAnswer) && currentAnswer.length === 0);

      const currentSerialized = JSON.stringify(currentAnswer ?? null);
      const isChanged =
        lastSavedAnswersRef.current[currentQuestion.id] !== currentSerialized;

      if (hasAnswer && isChanged) {
        lastSavedAnswersRef.current[currentQuestion.id] = currentSerialized;
        const answerPayload = formatAnswerPayload(
          currentQuestion,
          currentAnswer
        );
        api
          .saveResponseProgress(form.slug, {
            response_id: responseIdRef.current ?? undefined,
            started_at: startTimeRef.current
              ? new Date(startTimeRef.current).toISOString()
              : undefined,
            answers: [answerPayload],
          })
          .then((res) => {
            if (res?.response_id) {
              responseIdRef.current = res.response_id;
              setResponseId(res.response_id);
            }
          })
          .catch(() => {
            // Progress-call failures are silent (no toast, never block navigation)
          });
      }
    }

    // Determine next question via logic rules or sequential progression
    const rule = findMatchingRule(currentQuestion, currentAnswer);
    let targetIdx: number | null = null;
    let jumpToEnd = false;

    if (rule) {
      if (rule.target_question_id === null || rule.target_question_id === undefined) {
        jumpToEnd = true;
      } else {
        const found = questions.findIndex((q) => q.id === rule.target_question_id);
        if (found !== -1 && found > currentIndex) {
          targetIdx = found;
        }
      }
    }

    if (!jumpToEnd && targetIdx === null && !isLastQuestion) {
      targetIdx = currentIndex + 1;
    }

    // Advance to next question along the logic path
    if (targetIdx !== null) {
      setDirection(1);
      setHistory((prev) => [...prev, targetIdx!]);
      setCurrentIndex(targetIdx);
      return;
    }

    // Reached submit point (jumpToEnd or isLastQuestion): validate only visited path
    const visitedIndices = Array.from(new Set([...history, currentIndex]));
    const visitedQuestions = visitedIndices.map((i) => questions[i]);

    const validationErrors: Record<number, string> = {};
    for (let i = 0; i < visitedQuestions.length; i++) {
      const q = visitedQuestions[i];
      const qErr = validateQuestionAnswer(q, answers[q.id]);
      if (qErr) {
        validationErrors[q.id] = qErr;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Navigate to the first invalid visited question
      const firstInvalidIndex = questions.findIndex(
        (q) => !!validationErrors[q.id]
      );
      if (firstInvalidIndex !== -1 && firstInvalidIndex !== currentIndex) {
        setDirection(firstInvalidIndex > currentIndex ? 1 : -1);
        setCurrentIndex(firstInvalidIndex);
      }
      return;
    }

    // Submit Response
    if (mode === "preview") {
      toast.info("Preview submission complete! Answers are not saved to database.");
      setScreen("thankyou");
      return;
    }

    if (!form.slug) {
      toast.error("Form does not have an active slug to submit to.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadAnswers = visitedQuestions.map((q) =>
        formatAnswerPayload(q, answers[q.id])
      );

      await api.submitPublicResponse(form.slug, {
        response_id: responseIdRef.current ?? responseId ?? undefined,
        answers: payloadAnswers,
        started_at: startTimeRef.current
          ? new Date(startTimeRef.current).toISOString()
          : undefined,
      });

      setScreen("thankyou");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.validationErrors) {
        const serverErrors: Record<number, string> = {};
        for (const [qIdStr, msg] of Object.entries(err.validationErrors)) {
          const qId = parseInt(qIdStr, 10);
          if (!isNaN(qId)) {
            serverErrors[qId] = msg;
          }
        }
        setErrors(serverErrors);

        // Jump to first invalid question
        const firstInvalidIdx = questions.findIndex((q) => !!serverErrors[q.id]);
        if (firstInvalidIdx !== -1) {
          setDirection(firstInvalidIdx > currentIndex ? 1 : -1);
          setCurrentIndex(firstInvalidIdx);
          toast.error("Please correct the errors before submitting.");
        }
      } else {
        toast.error("Failed to submit response. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentQuestion,
    currentAnswer,
    isLastQuestion,
    questions,
    answers,
    currentIndex,
    history,
    mode,
    form.slug,
    responseId,
  ]);

  // Navigate backward using history stack
  const goPrev = useCallback(() => {
    if (history.length > 1) {
      const nextHistory = history.slice(0, -1);
      const prevIndex = nextHistory[nextHistory.length - 1];
      setHistory(nextHistory);
      setDirection(-1);
      setCurrentIndex(prevIndex);
    } else if (hasWelcomeScreen) {
      setDirection(-1);
      setScreen("welcome");
    }
  }, [history, hasWelcomeScreen]);

  // Global Keyboard listener for arrow up/down
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      // Ignore if typing in an input
      if (tag === "input" || tag === "textarea") return;

      if (screen === "question") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          goNext();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          goPrev();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, goNext, goPrev]);

  // Animation variants based on direction
  const variants: Variants = {
    initial: (dir: number) => ({
      y: dir > 0 ? 50 : -50,
      opacity: 0,
    }),
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        y: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -50 : 50,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    }),
  };

  // Progress percentage based on visited path
  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0;
    if (screen === "thankyou" || isSubmitStep) return 100;
    return Math.min(
      95,
      Math.round((history.length / Math.max(questions.length, history.length)) * 100)
    );
  }, [history.length, isSubmitStep, questions.length, screen]);

  // Render question input component based on type
  const renderInput = () => {
    if (!currentQuestion) return null;

    let settings: Record<string, unknown> = {};
    if (currentQuestion.settings_json) {
      try {
        settings = JSON.parse(currentQuestion.settings_json);
      } catch {
        settings = {};
      }
    }

    switch (currentQuestion.type) {
      case "short_text":
        return (
          <ShortTextInput
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={handleAnswerChange}
            onSubmit={goNext}
            placeholder={
              typeof settings.placeholder === "string"
                ? settings.placeholder
                : "Type your answer here..."
            }
          />
        );

      case "long_text":
        return (
          <LongTextInput
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={handleAnswerChange}
            onSubmit={goNext}
            placeholder={
              typeof settings.placeholder === "string"
                ? settings.placeholder
                : "Type your answer here..."
            }
          />
        );

      case "multiple_choice":
        return (
          <MultipleChoiceInput
            options={currentQuestion.options}
            value={(currentAnswer as string | string[]) || ""}
            onChange={handleAnswerChange}
            onAutoAdvance={!settings.allow_multiple ? goNext : undefined}
            isMultiSelect={!!settings.allow_multiple}
          />
        );

      case "yes_no":
        return (
          <YesNoInput
            value={
              typeof currentAnswer === "boolean" || typeof currentAnswer === "string"
                ? currentAnswer
                : null
            }
            onChange={handleAnswerChange}
            onAutoAdvance={goNext}
          />
        );

      case "email":
        return (
          <EmailInput
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={handleAnswerChange}
            onSubmit={goNext}
            placeholder={
              typeof settings.placeholder === "string"
                ? settings.placeholder
                : "name@example.com"
            }
          />
        );

      case "number":
        return (
          <NumberInput
            value={
              typeof currentAnswer === "number" || typeof currentAnswer === "string"
                ? currentAnswer
                : ""
            }
            onChange={handleAnswerChange}
            onSubmit={goNext}
            placeholder={
              typeof settings.placeholder === "string"
                ? settings.placeholder
                : "0"
            }
          />
        );

      case "rating":
        return (
          <RatingInput
            value={
              typeof currentAnswer === "number" || typeof currentAnswer === "string"
                ? currentAnswer
                : null
            }
            onChange={handleAnswerChange}
            onAutoAdvance={goNext}
            maxRating={
              typeof settings.max_rating === "number" ? settings.max_rating : 5
            }
          />
        );

      case "dropdown":
        return (
          <DropdownInput
            options={currentQuestion.options}
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={handleAnswerChange}
            onAutoAdvance={goNext}
          />
        );

      case "file_upload":
        return (
          <FileUploadInput
            value={currentAnswer}
            onChange={handleAnswerChange}
            onSubmit={goNext}
            slug={form.slug || ""}
          />
        );

      default:
        return (
          <ShortTextInput
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            onChange={handleAnswerChange}
            onSubmit={goNext}
          />
        );
    }
  };

  const theme = form.theme;
  const runnerStyle = {
    "--form-bg": theme?.background_color || "#EAEAEC",
    "--form-text": theme?.text_color || "#2B2530",
    "--form-button": theme?.button_color || "#2B2530",
    "--form-button-text": theme?.button_text_color || "#FFFFFF",
    "--form-font": resolveThemeFontCss(theme?.font),
  } as React.CSSProperties;

  return (
    <div
      style={runnerStyle}
      className="min-h-screen bg-white flex flex-col p-4 md:p-7 select-none relative font-[family-name:var(--form-font,var(--font-karla))]"
    >
      {/* Top Header per DESIGN_SPEC §2 */}
      <header className="h-10 px-3 flex items-center justify-between mb-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-6 h-6 flex items-center justify-center">
            <div
              className="absolute w-3 h-5 rounded-[2.5px] -left-0.5"
              style={{ backgroundColor: "var(--form-text, #2B2530)" }}
            />
            <div
              className="absolute w-3 h-3 opacity-80 rounded-[2.5px] -right-0.5 top-2"
              style={{ backgroundColor: "var(--form-text, #2B2530)" }}
            />
          </div>
          <span
            className="font-bold text-base tracking-tight"
            style={{ color: "var(--form-text, #2B2530)" }}
          >
            Formly
          </span>
        </Link>

        {mode === "preview" && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
              Preview Mode
            </span>
            {onClosePreview && (
              <button
                type="button"
                onClick={onClosePreview}
                className="text-xs font-medium text-[#6B6570] hover:text-[#2B2530]"
              >
                Exit preview
              </button>
            )}
          </div>
        )}
      </header>

      {/* ONE Large Inset Rounded Canvas per DESIGN_SPEC §2 */}
      <div
        className="flex-1 rounded-[20px] relative overflow-hidden flex flex-col justify-between p-6 md:p-12 shadow-inner transition-colors duration-200"
        style={{
          backgroundColor: "var(--form-bg, #EAEAEC)",
          color: "var(--form-text, #2B2530)",
        }}
      >
        {/* Progress Bar at the top of canvas */}
        {screen === "question" && questions.length > 0 && (
          <div className="absolute top-0 left-0 w-full h-1 bg-[#D4D2D6]/40">
            <motion.div
              className="h-full"
              style={{ backgroundColor: "var(--form-button, #2B2530)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Top questions counter */}
        {screen === "question" && questions.length > 0 && (
          <div
            className="text-xs font-medium select-none"
            style={{ color: "var(--form-text, #2B2530)", opacity: 0.75 }}
          >
            {currentIndex + 1} of {questions.length} answered
          </div>
        )}

        {/* Screen Transitions Container */}
        <div className="flex-1 flex items-center justify-center relative">
          <AnimatePresence custom={direction} mode="wait">
            {screen === "welcome" && (
              <motion.div
                key="welcome"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <WelcomeScreen
                  title={form.welcome_screen?.title || "Welcome"}
                  description={form.welcome_screen?.description}
                  buttonText={form.welcome_screen?.button_text || "Start"}
                  onStart={() => {
                    setDirection(1);
                    setScreen("question");
                  }}
                />
              </motion.div>
            )}

            {screen === "question" && currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <QuestionShell
                  number={currentIndex + 1}
                  totalQuestions={questions.length}
                  title={currentQuestion.title}
                  description={currentQuestion.description}
                  required={currentQuestion.required}
                  error={currentError}
                  onContinue={goNext}
                  isLastQuestion={isSubmitStep}
                  isSubmitting={isSubmitting}
                >
                  {renderInput()}
                </QuestionShell>
              </motion.div>
            )}

            {screen === "thankyou" && (
              <motion.div
                key="thankyou"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <ThankYouScreen
                  title={form.thank_you_title}
                  message={form.thank_you_message}
                  buttonText={form.ending_screen?.button_text}
                  buttonUrl={form.ending_screen?.button_url}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Up/Down Nav Arrows Bottom-Right per DESIGN_SPEC §2 */}
        {screen === "question" && (
          <div className="absolute bottom-6 right-6 flex items-center shadow-xs rounded-[8px] overflow-hidden border border-[#D4D2D6] bg-white">
            <button
              type="button"
              onClick={goPrev}
              disabled={history.length <= 1 && !hasWelcomeScreen}
              className="w-10 h-10 flex items-center justify-center text-[#2B2530] hover:bg-[#F5F5F5] disabled:opacity-30 disabled:hover:bg-white transition-colors border-r border-[#E6E6E8] cursor-pointer disabled:cursor-not-allowed"
              title="Previous question (↑)"
              aria-label="Previous question"
            >
              <ChevronUp className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className="w-10 h-10 flex items-center justify-center text-[#2B2530] hover:bg-[#F5F5F5] disabled:opacity-30 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Next question (↓)"
              aria-label="Next question"
            >
              <ChevronDown className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
