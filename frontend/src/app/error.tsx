"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected client error
    console.error("Formly client error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-md bg-white border border-[#E6E6E8] rounded-[24px] p-8 md:p-10 space-y-6 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-[#D9383A] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[#2B2530] tracking-tight">
            Something went wrong
          </h1>
          <p className="text-xs text-[#6B6570] leading-relaxed max-w-sm mx-auto">
            An unexpected error occurred while rendering this page. You can try reloading or navigate back to the dashboard.
          </p>
          {error.digest && (
            <p className="text-[10px] text-[#A8A3AD] font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try again</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Workspace</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
