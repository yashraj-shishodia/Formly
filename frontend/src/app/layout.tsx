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
    <html lang="en" className={`${inter.variable} ${karla.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-[#2B2530] font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
