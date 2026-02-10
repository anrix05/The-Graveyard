"use client";

import { useState } from "react";
import Link from "next/link";
import CyberButton from "@/components/ui/CyberButton";
import { Skull, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyber-gray bg-cyber-black/80 backdrop-blur supports-[backdrop-filter]:bg-cyber-black/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo / Title */}
        <Link href="/" className="flex items-center gap-2 group z-50">
          <div className="relative">
            <Skull className="h-6 w-6 text-cyber-red transition-transform group-hover:rotate-12" />
            <div className="absolute inset-0 bg-cyber-red/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-wider text-white group-hover:text-cyber-red transition-colors leading-none">
              THE GRAVEYARD
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8 text-sm font-mono text-cyber-muted">
            <Link href="/" className="hover:text-cyber-neon transition-colors">Browse</Link>
            <Link href="/submit" className="hover:text-cyber-neon transition-colors">Submit Project</Link>
          </nav>

          <div className="flex items-center gap-4 pl-4 border-l border-cyber-gray/30">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="font-mono text-cyber-neon tracking-wider animate-pulse-glow hover:text-white transition-colors">
                  [ {user.username} ]
                </Link>
                <CyberButton
                  variant="ghost"
                  className="border-cyber-red/50 text-cyber-red hover:bg-cyber-red/10 text-xs px-3 h-8"
                  onClick={logout}
                >
                  LOGOUT
                </CyberButton>
              </div>
            ) : (
              <Link href="/login">
                <CyberButton variant="ghost" className="border-cyber-gray text-cyber-foreground hover:bg-cyber-gray/20 hover:text-white font-mono tracking-wide">
                  <span className="mr-2">→</span>
                  ACCESS TERMINAL
                </CyberButton>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-cyber-muted hover:text-white z-50"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 bg-cyber-black/95 backdrop-blur-xl border-t border-cyber-gray/30 p-6 md:hidden flex flex-col gap-8 h-[calc(100vh-4rem)]" // Height adjusted for header
          >
            <nav className="flex flex-col gap-6 font-mono text-lg text-cyber-muted">
              <Link href="/" className="hover:text-cyber-neon transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Browse Projects
              </Link>
              <Link href="/submit" className="hover:text-cyber-neon transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Submit Project
              </Link>
            </nav>

            <div className="mt-auto pb-8">
              {user ? (
                <div className="space-y-4">
                  <div className="font-mono text-cyber-neon text-center tracking-wider pb-4 border-b border-cyber-gray/20">
                    IDENTIFIED: {user.username}
                  </div>

                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <CyberButton variant="ghost" className="w-full border border-cyber-neon text-cyber-neon py-4 cyber-clip-sm font-bold tracking-wider hover:bg-cyber-neon/10 mb-4">
                      ACCESS DASHBOARD
                    </CyberButton>
                  </Link>
                  <CyberButton
                    variant="ghost"
                    className="w-full border border-cyber-red text-cyber-red py-4 cyber-clip-sm font-bold tracking-wider hover:bg-cyber-red/10"
                    onClick={async () => {
                      try {
                        await logout();
                      } catch (error) {
                        console.error("Logout failed:", error);
                      } finally {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    TERMINATE SESSION
                  </CyberButton>
                </div>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <CyberButton className="w-full bg-cyber-red text-white py-4 cyber-clip-sm font-bold tracking-wider">
                    <span className="mr-2">→</span>
                    ACCESS TERMINAL
                  </CyberButton>
                </Link>
              )}
            </div>

            {/* Scanline overlay for menu */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Scanline below header */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyber-red/50 to-transparent opacity-50" />
    </header>
  );
};

export default Header;