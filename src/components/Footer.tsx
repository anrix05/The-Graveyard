import Link from "next/link";
import { Skull } from "lucide-react";

const Footer = () => {
    return (
        <footer className="w-full border-t border-cyber-gray/30 bg-cyber-black py-6 mt-auto relative z-10">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Skull className="w-5 h-5 text-cyber-red" />
                    <span className="font-mono text-sm text-cyber-muted flex items-center gap-2">
                        <span className="text-white font-display font-bold tracking-wider">THE GRAVEYARD</span>
                        <span>© 2026</span>
                    </span>
                </div>

                <div className="flex items-center gap-8 text-sm font-mono text-cyber-muted">
                    <Link href="/terms" className="hover:text-cyber-red transition-colors">Terms</Link>
                    <Link href="/privacy" className="hover:text-cyber-red transition-colors">Privacy</Link>
                    <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyber-red transition-colors">GitHub</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
