import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieSettingsTrigger from '@/components/legal/CookieSettingsTrigger';
import { CONTACT_EMAIL, GITHUB_URL } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How The Graveyard collects, uses, and protects your information.',
  alternates: {
    canonical: '/privacy',
  },
};

const LAST_UPDATED = 'March 2026';

export default function PrivacyPage() {
  const contactText = CONTACT_EMAIL || GITHUB_URL;
  const isEmail = Boolean(CONTACT_EMAIL);

  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col font-sans pt-[var(--header-h)]">
      <div className="print:hidden">
        <Header />
      </div>

      <main id="main" tabIndex={-1} className="flex-1 max-w-[68ch] mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 space-y-10 outline-none">
        {/* Portfolio Demo Notice */}
        <div className="p-4 rounded-xl bg-amber/10 border border-amber/30 text-amber text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Portfolio Demonstration Notice:</strong> This is a portfolio project. These documents are plain-language templates for demonstration and are not legal advice.
          </p>
        </div>

        {/* Title Area */}
        <div className="space-y-2 border-b border-line pb-6">
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white tracking-tight">
            Privacy policy
          </h1>
          <p className="font-mono text-xs text-muted">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Table of Contents */}
        <nav aria-label="Table of contents" className="p-5 rounded-2xl bg-surface border border-line space-y-3 print:hidden">
          <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold block">
            Table of contents
          </span>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-fg/80">
            <li><a href="#what-we-collect" className="hover:text-white transition-colors">1. What we collect</a></li>
            <li><a href="#why-we-use-it" className="hover:text-white transition-colors">2. Why we use your data</a></li>
            <li><a href="#cookies" className="hover:text-white transition-colors">3. Cookies and analytics</a></li>
            <li><a href="#service-providers" className="hover:text-white transition-colors">4. Third-party service providers</a></li>
            <li><a href="#retention" className="hover:text-white transition-colors">5. Data retention</a></li>
            <li><a href="#rights" className="hover:text-white transition-colors">6. Your privacy rights</a></li>
            <li><a href="#children" className="hover:text-white transition-colors">7. Children's privacy</a></li>
            <li><a href="#security" className="hover:text-white transition-colors">8. Security measures</a></li>
            <li><a href="#changes" className="hover:text-white transition-colors">9. Changes to this policy</a></li>
            <li><a href="#contact" className="hover:text-white transition-colors">10. Contact information</a></li>
          </ol>
        </nav>

        {/* Policy Body */}
        <div className="space-y-10 font-sans text-sm text-fg/80 leading-relaxed break-anywhere">
          <section id="what-we-collect" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              1. What we collect
            </h2>
            <p>
              When you use The Graveyard, we collect only the necessary information to provide the marketplace and collaboration services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-brand-red">
              <li>
                <strong>Account data:</strong> Email address, public username, profile avatar, short bio, and optional connected GitHub username.
              </li>
              <li>
                <strong>Listing content:</strong> Codebase titles, taglines, technical descriptions, tech stacks, licenses, and files you upload (e.g. source code archives or screenshots).
              </li>
              <li>
                <strong>Transaction records:</strong> Order IDs, amounts, timestamps, and delivery statuses. All payments are strictly executed in <em>Razorpay Test Mode</em>. We never process or store real credit card numbers or banking data.
              </li>
              <li>
                <strong>Encrypted communications:</strong> Direct transmission messages and collaboration pitches exchanged between creators and buyers on the platform.
              </li>
              <li>
                <strong>Technical telemetry:</strong> IP addresses, browser types, and access timestamps recorded in standard hosting and reverse-proxy logs.
              </li>
            </ul>
          </section>

          <section id="why-we-use-it" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              2. Why we use your data
            </h2>
            <p>
              We process collected data exclusively to maintain platform integrity and functionality:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-brand-red">
              <li>To authenticate your session and protect account access.</li>
              <li>To deliver source code downloads and dispatch GitHub repository collaborator invitations.</li>
              <li>To notify sellers of purchase transactions and incoming co-founder pitches.</li>
              <li>To prevent abuse, spam, malware uploads, or unauthorized access.</li>
            </ul>
          </section>

          <section id="cookies" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              3. Cookies and analytics
            </h2>
            <p>
              We believe in minimal, honest data tracking:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-brand-red">
              <li>
                <strong>Essential cookies:</strong> Used strictly for secure authentication session tokens (via Supabase Auth). These are necessary for user login.
              </li>
              <li>
                <strong>Cookieless analytics:</strong> We use privacy-friendly Vercel Web Analytics and Speed Insights. They do not store persistent tracking cookies, fingerprint devices across sites, or collect personal identifying information (PII).
              </li>
              <li>
                <strong>Opt-out options:</strong> You can opt out of analytics at any time via the consent notice or our <CookieSettingsTrigger>Cookie Settings dialog</CookieSettingsTrigger>. We automatically respect Do Not Track (<code className="font-mono text-xs">DNT: 1</code>) and Global Privacy Control headers.
              </li>
            </ul>
          </section>

          <section id="service-providers" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              4. Third-party service providers
            </h2>
            <p>
              We rely on trusted infrastructure partners to host and operate the platform:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-brand-red">
              <li><strong>Supabase:</strong> Managed PostgreSQL database, authentication, and encrypted asset storage.</li>
              <li><strong>Vercel:</strong> Edge hosting, serverless functions, and performance telemetry.</li>
              <li><strong>Razorpay:</strong> Payment simulation gateway in <em>Test Mode</em> only.</li>
              <li><strong>GitHub API:</strong> Automating repository collaborator invitations upon code acquisition.</li>
              <li><strong>Google OAuth:</strong> Optional one-click federated sign-in.</li>
            </ul>
          </section>

          <section id="retention" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              5. Data retention
            </h2>
            <p>
              Your account profile, listings, and transaction histories remain active while your account exists. If you choose to delete your account or specific listings, uploaded archives and records will be removed from active indexes in accordance with retention schedules.
            </p>
          </section>

          <section id="rights" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              6. Your privacy rights
            </h2>
            <p>
              You have the right to request access to your personal data, rectify incorrect information, or delete your account. You can permanently delete and anonymize your account at any time directly via self-service in <strong>Console &gt; Settings &gt; Danger zone</strong>. This immediately anonymizes your public profile, archives all active code listings, and revokes login access, while preserving purchase records so buyers retain their purchased downloads. You may also contact us at{' '}
              {isEmail ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-white underline hover:text-brand-red">
                  {CONTACT_EMAIL}
                </a>
              ) : (
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-brand-red">
                  our GitHub repository
                </a>
              )}
              .
            </p>
          </section>

          <section id="children" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              7. Children's privacy
            </h2>
            <p>
              The Graveyard is designed for developers and adults over the age of 18. We do not knowingly solicit or collect personal information from minors.
            </p>
          </section>

          <section id="security" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              8. Security measures
            </h2>
            <p>
              We implement realistic, defense-in-depth technical controls:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-brand-red">
              <li>All web traffic is enforced over HTTPS (TLS encryption in transit).</li>
              <li>PostgreSQL Row Level Security (RLS) ensures that private delivery coordinates, repository links, and archives can only be retrieved by verified buyers and sellers.</li>
              <li>Source code archives are distributed via short-lived, signed storage URLs with expiration limits.</li>
            </ul>
            <p className="text-xs text-muted">
              Note: We do not claim external SOC-2, ISO, or military-grade certifications. Please exercise customary caution when sharing proprietary code.
            </p>
          </section>

          <section id="changes" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              9. Changes to this policy
            </h2>
            <p>
              We may update this policy periodically to reflect platform enhancements or regulatory changes. The "Last updated" date at the top of this document indicates the effective revision.
            </p>
          </section>

          <section id="contact" className="space-y-3 scroll-mt-24 pt-4 border-t border-line">
            <h2 className="text-xl font-display font-semibold text-white">
              10. Contact information
            </h2>
            <p>
              For privacy inquiries, takedown notices, or data requests, please reach out via{' '}
              {isEmail ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-red underline hover:text-white">
                  {CONTACT_EMAIL}
                </a>
              ) : (
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-brand-red underline hover:text-white">
                  our GitHub repository issue tracker
                </a>
              )}
              .
            </p>
          </section>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
