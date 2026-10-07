"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--surface-card, #2B2530)",
              color: "var(--text-primary, #FFFFFF)",
              border: "1px solid var(--border, #E6E6E8)",
              borderRadius: "8px",
              fontSize: "14px",
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
