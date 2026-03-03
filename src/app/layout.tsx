import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATS System Pro - AI-Powered Resume Optimization",
  description: "Professional ATS resume optimization system with AI-powered tailoring, interview preparation, and compliance validation. Built for aviation professionals and job seekers.",
  keywords: ["ATS", "Resume Optimization", "AI", "Job Application", "Aviation", "Career", "Interview Prep", "Cover Letter"],
  authors: [{ name: "ATS System Pro Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ATS System Pro - AI-Powered Resume Optimization",
    description: "Professional ATS resume optimization with free AI SDK integration",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ATS System Pro",
    description: "AI-Powered Resume Optimization",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
