import { Bricolage_Grotesque, Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';

export const displayFont = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const sansFont = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const monoFont = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const accentFont = Instrument_Serif({
  variable: '--font-accent',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
});

/**
 * Display typography style switcher.
 * - 'grotesk': Bricolage Grotesque (default)
 * - 'serif': Instrument Serif
 */
export const DISPLAY_STYLE: 'grotesk' | 'serif' = 'grotesk';
