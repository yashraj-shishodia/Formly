"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ThankYouScreenProps {
  title?: string | null;
  message?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
}

export function ThankYouScreen({
  title = "Thank you!",
  message = "Your response has been recorded.",
  buttonText,
  buttonUrl,
}: ThankYouScreenProps) {
  return (
    <div className="w-full max-w-xl mx-auto text-center flex flex-col items-center justify-center space-y-6 py-12 px-4">
      {/* Animated Checkmark Circle */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="w-16 h-16 rounded-full bg-[#E6F4EA] border border-[#2F7D69]/30 flex items-center justify-center text-[#2F7D69] shadow-xs"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          <Check className="w-8 h-8 stroke-[3]" />
        </motion.div>
      </motion.div>

      <div className="space-y-3">
        <h1
          className="text-3xl md:text-4xl font-normal tracking-tight leading-tight"
          style={{
            color: "var(--form-text, #2B2530)",
            fontFamily: "var(--form-font, var(--font-karla))",
          }}
        >
          {title || "Thank you!"}
        </h1>
        <p
          className="text-base md:text-lg leading-relaxed max-w-md mx-auto"
          style={{
            color: "var(--form-text, #2B2530)",
            opacity: 0.75,
            fontFamily: "var(--form-font, var(--font-karla))",
          }}
        >
          {message || "Your response has been recorded."}
        </p>
      </div>

      {buttonText && buttonUrl && (
        <div className="pt-3">
          <Link href={buttonUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="primary"
              size="lg"
              style={{
                backgroundColor: "var(--form-button, #2B2530)",
                color: "var(--form-button-text, #FFFFFF)",
              }}
              className="gap-2 border-0 hover:opacity-90"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Powered by footer branding */}
      <div className="pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#E6E6E8] text-xs text-[#6B6570] hover:text-[#2B2530] transition-colors shadow-2xs"
        >
          <span>Create a form with</span>
          <strong className="font-bold text-[#2B2530]">Formly</strong>
        </Link>
      </div>
    </div>
  );
}
