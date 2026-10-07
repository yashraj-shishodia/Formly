"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--surface-page)] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-md bg-[var(--surface-card)] border border-[var(--border)] rounded-[24px] p-8 md:p-12 space-y-6 shadow-xs">
        {/* Emblem */}
        <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
          <div className="absolute w-5 h-8 bg-[var(--primary)] rounded-[3px] -left-0.5" />
          <div className="absolute w-5 h-5 bg-[var(--primary)]/80 rounded-[3px] -right-0.5 top-3" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            404
          </h1>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Page Not Found
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
            The page you are looking for does not exist, has been moved, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" size="md" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Formly</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
