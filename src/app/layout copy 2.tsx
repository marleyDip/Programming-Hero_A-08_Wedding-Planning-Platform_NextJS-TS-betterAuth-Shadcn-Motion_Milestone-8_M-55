import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import Footer from "@/components/shared/footer";
import NavbarWrapper from "@/components/shared/navbar-wrapper";
import { ThemeProvider } from "@/components/shared/theme-provider";
import AppToaster from "@/components/ui/toaster";

import { auth } from "@/lib/auth";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get authenticated session on the server
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const authUser = session?.user as
    | (typeof session.user & {
        role?: string;
        subscriptionPlan?: string;
      })
    | undefined;

  const user = authUser
    ? {
        name: authUser.name,
        image: authUser.image,
        role: authUser.role,
        subscriptionPlan: authUser.subscriptionPlan,
      }
    : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          {/* Navbar */}
          <NavbarWrapper user={user} />

          <main className="pt-24">{children}</main>

          {/* Footer */}
          <Footer isAuthenticated={!!session?.user} />

          {/* Sonner Toaster */}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
