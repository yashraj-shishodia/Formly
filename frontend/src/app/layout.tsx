import type { Metadata } from "next";
import { Inter, Karla } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Formly — Modern Conversational Forms",
  description: "Create beautiful, high-converting forms with live previews and smooth respondent workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${karla.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('formly-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(!s&&d)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--surface-page)] text-[var(--text-primary)] font-sans antialiased transition-colors duration-150">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
