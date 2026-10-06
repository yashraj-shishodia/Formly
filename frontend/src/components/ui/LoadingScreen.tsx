"use client";

import React from "react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading your form..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 select-none">
      {/* Two-rounded-rectangle logo mark (Typeform-style emblem) */}
      <div className="relative w-14 h-14 mb-8 flex items-center justify-center">
        <div className="absolute w-8 h-12 bg-[#2B2530] rounded-md -left-1 animate-pulse" />
        <div className="absolute w-8 h-8 bg-[#2B2530]/80 rounded-md -right-1 top-4" />
      </div>

      {/* Message below emblem */}
      <p className="text-[26px] font-respondent text-[#2B2530] tracking-tight font-medium text-center max-w-md">
        {message}
      </p>
    </div>
  );
}
