import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import AuthenticatedFooter from "@/components/shared/authenticated-footer";
import AuthenticatedNavbar from "@/components/shared/authenticated-navbar";
import { ThemeProvider } from "@/components/shared/theme-provider";
import AppToaster from "@/components/ui/toaster";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WedPlan | Plan Your Perfect Wedding",
    template: "%s | WedPlan",
  },
  description:
    "Plan your dream wedding effortlessly with WedPlan. Organize events, manage guests, and create unforgettable memories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          {/* Navbar */}
          <Suspense fallback={null}>
            <AuthenticatedNavbar />
          </Suspense>

          {/* Page Content */}
          <main className="pt-24">{children}</main>

          {/* Footer */}
          <Suspense fallback={null}>
            <AuthenticatedFooter />
          </Suspense>

          {/* Notifications */}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
