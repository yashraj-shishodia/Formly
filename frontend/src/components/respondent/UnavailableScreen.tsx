"use client";

import React from "react";
import Link from "next/link";
import { EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UnavailableScreenProps {
  message?: string;
}

export function UnavailableScreen({
  message = "This form is not currently accepting responses or is saved as an unpublished draft.",
}: UnavailableScreenProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-md bg-[#F5F5F5] border border-[#E6E6E8] rounded-[24px] p-8 md:p-12 space-y-5">
        <div className="w-14 h-14 rounded-full bg-white border border-[#E6E6E8] flex items-center justify-center mx-auto text-[#6B6570]">
          <EyeOff className="w-6 h-6 text-[#A8A3AD]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#2B2530] tracking-tight">
            Form Unavailable
          </h1>
          <p className="text-xs text-[#6B6570] leading-relaxed">
            {message}
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
