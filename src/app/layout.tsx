import type { Metadata } from "next";
import { Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "../index.css"; // Preserving the original styles
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

const chakraPetch = Chakra_Petch({
    variable: "--font-chakra",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "The Graveyard | Dead Code Marketplace",
    description: "A marketplace for abandoned projects.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${chakraPetch.variable} ${jetbrainsMono.variable} font-sans bg-cyber-black text-foreground antialiased selection:bg-cyber-red selection:text-white`}
            >
                <AuthProvider>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
