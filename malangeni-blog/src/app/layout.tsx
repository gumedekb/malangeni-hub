import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { OnboardingGate } from "@/components/auth/OnboardingGate";
import { NotificationsProvider } from "@/lib/notifications/NotificationsContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  // Share previews (Open Graph) need full URLs. Set NEXT_PUBLIC_SITE_URL once deployed.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Malangeni Hub",
  description: "A local community platform for Malangeni — news, places, and services.",
  openGraph: {
    siteName: "Malangeni Hub",
    type: "website",
    locale: "en_ZA",
  },
};

/**
 * Runs before first paint so the page never flashes the wrong theme: a saved
 * choice wins, otherwise follow the OS setting. Mirrored in ThemeToggle.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The inline script adds `dark` to the class list before React hydrates.
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
      </head>
      <body className="font-sans leading-normal">
        <AuthProvider>
          <NotificationsProvider>
            <OnboardingGate />
            <Header />
            {children}
            <Footer />
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
