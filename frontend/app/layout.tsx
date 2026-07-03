import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeScript } from "@/components/theme-script";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-spline-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Legally — AI-native legal workspace",
  description:
    "Screen documents, draft and redline clauses, and research matters with cited, reviewable AI.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${fraunces.variable} ${hanken.variable} ${splineMono.variable} antialiased`}
      >
        <div className="app-backdrop" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
