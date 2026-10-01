import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CONTACT_EMAIL, GITHUB_URL } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms and conditions governing the use of The Graveyard marketplace.',
  alternates: {
    canonical: '/terms',
  },
};

const LAST_UPDATED = 'March 2026';

export default function TermsPage() {
  const contactText = CONTACT_EMAIL || GITHUB_URL;
  const isEmail = Boolean(CONTACT_EMAIL);

  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col font-sans">
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
            Terms of use
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
            <li><a href="#about-test-mode" className="hover:text-white transition-colors">1. About the project &amp; test-mode notice</a></li>
            <li><a href="#eligibility" className="hover:text-white transition-colors">2. Eligibility and accounts</a></li>
            <li><a href="#listings-ownership" className="hover:text-white transition-colors">3. Listings, code ownership &amp; conduct</a></li>
            <li><a href="#licenses" className="hover:text-white transition-colors">4. Software licenses &amp; transfers</a></li>
            <li><a href="#content-license" className="hover:text-white transition-colors">5. User content license to the platform</a></li>
            <li><a href="#takedown" className="hover:text-white transition-colors">6. Copyright reporting and takedowns</a></li>
            <li><a href="#disclaimers" className="hover:text-white transition-colors">7. Disclaimers and limitation of liability</a></li>
            <li><a href="#termination" className="hover:text-white transition-colors">8. Account termination</a></li>
            <li><a href="#governing-law" className="hover:text-white transition-colors">9. Governing law (review notice)</a></li>
            <li><a href="#contact" className="hover:text-white transition-colors">10. Contact information</a></li>
          </ol>
        </nav>

        {/* Terms Body */}
        <div className="space-y-10 font-sans text-sm text-fg/80 leading-relaxed break-anywhere">
          <section id="about-test-mode" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              1. About the project and test-mode notice
            </h2>
            <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-2">
              <span className="font-mono text-xs font-semibold text-[#39ff14] block">
                IMPORTANT TEST-MODE NOTICE:
              </span>
              <p className="text-xs text-muted leading-relaxed">
                The Graveyard is an engineering portfolio demonstration. All payment gateways are operated exclusively in <strong>Razorpay Test Mode</strong> using simulated credentials. No real currency is charged, held, or disbursed. Listings, demo transactions, and collaboration pitches are simulated assets for platform testing.
              </p>
            </div>
            <p>
              By accessing or using The Graveyard ("the Service"), you agree to abide by these Terms of Use. If you do not agree with any provision, please discontinue using the website.
            </p>
          </section>

          <section id="eligibility" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              2. Eligibility and accounts
            </h2>
            <p>
              You must be at least 18 years of age or possess legal capacity in your jurisdiction to create an account or publish listings. You are responsible for safeguarding your login credentials and for any activity that occurs under your account.
            </p>
          </section>

          <section id="listings-ownership" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              3. Listings, code ownership, and conduct
            </h2>
            <p>
              When submitting a project or repository to the platform:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-brand-red">
              <li>
                <strong>Original authorship:</strong> You represent and warrant that you are the creator or authorized owner of the software, or possess the lawful right to license or transfer the intellectual property.
              </li>
              <li>
                <strong>No malicious payload:</strong> You must not upload viruses, trojans, ransomware, backdoors, or malicious exploit code.
              </li>
              <li>
                <strong>No stolen or proprietary secrets:</strong> You must not upload code containing leaked proprietary corporate secrets, stolen API credentials, private customer data, or unredacted keys.
              </li>
              <li>
                <strong>Accurate descriptions:</strong> Cause of death, completion percentages, lines of code, and known limitations must reflect accurate assessments of the codebase.
              </li>
            </ul>
          </section>

          <section id="licenses" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              4. Software licenses and transfers
            </h2>
            <p>
              The platform facilitates three distinct interaction models:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-brand-red">
              <li>
                <strong>For Sale (`buy`):</strong> Designed as an exclusive one-time transfer of project ownership. Upon purchase fulfillment, the seller agrees not to resell the listing to any other party.
              </li>
              <li>
                <strong>Free Fork (`adopt`):</strong> Claimants receive non-exclusive rights under the open-source license declared on the listing (e.g., MIT, Apache 2.0, GPL).
              </li>
              <li>
                <strong>Seeking Partner (`collab`):</strong> A bilateral matchmaking channel for co-founders. Specific terms (equity, rev-share, milestone fees) must be mutually agreed between parties.
              </li>
            </ul>
          </section>

          <section id="content-license" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              5. User content license to the platform
            </h2>
            <p>
              You retain ownership of the software and text you submit. By uploading listings, you grant The Graveyard a non-exclusive, worldwide, royalty-free license to display, host, and index your project title, descriptions, covers, and metrics solely for platform operation and discovery.
            </p>
          </section>

          <section id="takedown" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              6. Copyright reporting and takedowns
            </h2>
            <p>
              We respect intellectual property rights. If you believe your copyrighted software has been uploaded without authorization, email us at{' '}
              {isEmail ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-white underline hover:text-brand-red">
                  {CONTACT_EMAIL}
                </a>
              ) : (
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-brand-red">
                  our GitHub repository
                </a>
              )}{' '}
              with:
            </p>
            <ul className="list-disc pl-5 space-y-1 marker:text-brand-red text-xs">
              <li>The specific listing URL on The Graveyard.</li>
              <li>Proof of your ownership or original repository link.</li>
              <li>Your contact information and statement of good faith.</li>
            </ul>
            <p className="text-xs text-muted">
              Infringing listings will be promptly archived and removed from public discovery.
            </p>
          </section>

          <section id="disclaimers" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              7. Disclaimers and limitation of liability
            </h2>
            <p className="uppercase text-xs text-muted font-mono leading-relaxed">
              THE SERVICE AND ALL TRANSFERRED CODEBASES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p>
              Because projects listed on The Graveyard are dormant or abandoned software, they may contain bugs, incomplete dependencies, or unpatched vulnerabilities. You accept full responsibility for reviewing, testing, and deploying any acquired code.
            </p>
          </section>

          <section id="termination" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              8. Account termination
            </h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate intellectual property rules, upload malicious software, or abuse communication channels.
            </p>
          </section>

          <section id="governing-law" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-display font-semibold text-white">
              9. Governing law (placeholder notice)
            </h2>
            <p>
              These Terms shall be construed in accordance with the laws of India, without regard to conflict of law principles.
            </p>
            <p className="text-xs text-muted">
              <em>Note for Production Deployment:</em> This clause is a portfolio template placeholder and should be reviewed with qualified legal counsel prior to processing commercial financial volumes.
            </p>
          </section>

          <section id="contact" className="space-y-3 scroll-mt-24 pt-4 border-t border-line">
            <h2 className="text-xl font-display font-semibold text-white">
              10. Contact information
            </h2>
            <p>
              If you have questions regarding these Terms of Use, please contact us at{' '}
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
