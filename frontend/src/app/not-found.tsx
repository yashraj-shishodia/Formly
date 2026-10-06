"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-md bg-[#F5F5F5] border border-[#E6E6E8] rounded-[24px] p-8 md:p-12 space-y-6 shadow-xs">
        {/* Emblem */}
        <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
          <div className="absolute w-5 h-8 bg-[#2B2530] rounded-[3px] -left-0.5" />
          <div className="absolute w-5 h-5 bg-[#2B2530]/80 rounded-[3px] -right-0.5 top-3" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#2B2530] tracking-tight">
            404
          </h1>
          <h2 className="text-base font-semibold text-[#2B2530]">
            Page Not Found
          </h2>
          <p className="text-xs text-[#6B6570] leading-relaxed max-w-xs mx-auto">
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
