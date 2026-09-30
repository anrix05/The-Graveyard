import type { Metadata } from "next";
import { displayFont, sansFont, monoFont, accentFont, DISPLAY_STYLE } from "@/lib/fonts";
import "../index.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { Toaster } from "sonner";
import SmoothScroll from "@/components/motion/SmoothScroll";
import MotionReady from "@/components/motion/MotionReady";
import IntroOverlay from "@/components/intro/IntroOverlay";
import { getIntroHeadScript } from "@/lib/intro";

export const metadata: Metadata = {
  title: "The Graveyard — Where Dead Code Gets Resurrected",
  description: "A developer marketplace and collaboration platform where abandoned projects, MVPs, and codebases get a second life.",
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
      <body
        className="bg-bg text-fg antialiased selection:bg-brand-red selection:text-white"
      >
        <IntroOverlay />
        <div id="app-root" className="min-h-screen">
          <MotionReady />
          <AuthProvider>
            <ToastProvider>
              <SmoothScroll>
                {children}
              </SmoothScroll>
              <Toaster
                theme="dark"
                position="top-right"
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
            </ToastProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
