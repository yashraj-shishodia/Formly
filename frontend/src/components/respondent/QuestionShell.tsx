"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QuestionShellProps {
  number: number;
  totalQuestions: number;
  title: string;
  description?: string | null;
  required?: boolean;
  error?: string | null;
  children: React.ReactNode;
  onContinue: () => void;
  isLastQuestion: boolean;
  isSubmitting?: boolean;
  customButtonText?: string;
}

export function QuestionShell({
  number,
  totalQuestions,
  title,
  description,
  required = false,
  error,
  children,
  onContinue,
  isLastQuestion,
  isSubmitting = false,
  customButtonText,
}: QuestionShellProps) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-center px-4 md:px-0">
      {/* Title block with number badge */}
      <div className="space-y-2">
        <div className="flex items-start gap-3.5">
          {/* Number badge per DESIGN_SPEC §2 (ref-09) */}
          <div className="mt-1 w-7 h-7 rounded-[6px] bg-[#2B2530] text-white flex items-center justify-center text-xs font-bold shrink-0 tracking-tight select-none">
            {number}
            <span className="text-[10px] ml-0.5 opacity-80">→</span>
          </div>

          <div className="flex-1 space-y-1.5">
            {/* Title with optional required asterisk */}
            <h2 className="text-2xl md:text-[30px] font-normal text-[#2B2530] leading-snug tracking-tight font-karla">
              {title}
              {required && (
                <span className="text-[#D9383A] ml-1 font-semibold" title="Required">
                  *
                </span>
              )}
            </h2>

            {/* Optional Description */}
            {description && (
              <p className="text-sm md:text-base text-[#6B6570] leading-relaxed font-karla">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Answer Input Area (~40px gap per DESIGN_SPEC §2) */}
      <div className="mt-8 mb-6 ml-0 md:ml-10">
        {children}

        {/* Validation Error Shake Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                x: [0, -6, 6, -4, 4, -2, 2, 0],
              }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-red-50 border border-red-200/80 text-xs font-medium text-[#D9383A]"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Button & Enter Hint */}
      <div className="ml-0 md:ml-10 flex items-center gap-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={onContinue}
          isLoading={isSubmitting}
          className="text-base font-medium px-6 py-3 rounded-[8px] bg-[#2B2530] hover:bg-[#3A3340] text-white shadow-xs"
        >
          {customButtonText || (isLastQuestion ? "Submit" : "Continue")}
        </Button>

        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[#6B6570] font-normal select-none">
          press <strong className="font-semibold text-[#2B2530]">Enter</strong>
          <CornerDownLeft className="w-3.5 h-3.5 text-[#6B6570]" />
        </span>
      </div>
    </div>
  );
}
