import type { Metadata, Viewport } from "next";
import { displayFont, sansFont, monoFont, accentFont, DISPLAY_STYLE } from "@/lib/fonts";
import "../index.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { Toaster } from "sonner";
import SmoothScroll from "@/components/motion/SmoothScroll";
import MotionReady from "@/components/motion/MotionReady";
import IntroOverlay from "@/components/intro/IntroOverlay";
import ViewportBadge from "@/components/dev/ViewportBadge";
import { getIntroHeadScript } from "@/lib/intro";
import { SITE_URL } from "@/lib/env";
import ConsentNotice from "@/components/legal/ConsentNotice";
import AnalyticsWrapper from "@/components/analytics/AnalyticsWrapper";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s · The Graveyard",
    default: "The Graveyard: where dead code gets resurrected",
  },
  description:
    "Buy, adopt or collaborate on abandoned software projects. A marketplace for unfinished code, ready for a second life.",
  applicationName: "The Graveyard",
  keywords: [
    "developer marketplace",
    "abandoned code",
    "resurrect code",
    "side projects",
    "buy code",
    "open source",
    "code liquidation",
  ],
  openGraph: {
    type: "website",
    siteName: "The Graveyard",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`dark ${displayFont.variable} ${sansFont.variable} ${monoFont.variable} ${accentFont.variable}`}
      data-display={DISPLAY_STYLE}
      data-motion-ready="false"
    >
      <head>
        <script
          id="intro-early-eval"
          dangerouslySetInnerHTML={{ __html: getIntroHeadScript() }}
        />
        <noscript>
          <style>{`#intro-root { display: none !important; }`}</style>
        </noscript>
      </head>
      <body className="bg-bg text-fg antialiased selection:bg-brand-red selection:text-white">
        {/* Skip to Main Content Link (Accessible Keyboard Navigation) */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-red focus:text-white focus:rounded-full focus:font-mono focus:text-xs focus:shadow-2xl focus:outline-none"
        >
          Skip to main content
        </a>

        <IntroOverlay />
        <div id="app-root" className="min-h-dvh flex flex-col w-full overflow-x-clip">
          <MotionReady />
          <AuthProvider>
            <ToastProvider>
              <SmoothScroll>{children}</SmoothScroll>
              <Toaster
                theme="dark"
                position="top-right"
                className="toaster group"
                toastOptions={{
                  style: {
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--fg)",
                    borderRadius: "16px",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                  },
                }}
              />
              <ConsentNotice />
              <ViewportBadge />
            </ToastProvider>
          </AuthProvider>
        </div>
        <AnalyticsWrapper />
      </body>
    </html>
  );
}
