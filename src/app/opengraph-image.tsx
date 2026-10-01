import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'The Graveyard — Where Dead Code Gets Resurrected';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0b',
          backgroundImage:
            'radial-gradient(circle at 50% 45%, rgba(255, 42, 42, 0.18) 0%, rgba(10, 10, 11, 0.95) 60%, #0a0a0b 100%)',
          padding: '64px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Subtle grid border overlay */}
        <div
          style={{
            position: 'absolute',
            inset: '32px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
          }}
        />

        {/* Center Skull SVG Mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            marginBottom: '32px',
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff2a2a"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12c0 3.85 2.17 7.2 5.37 8.9l.63.33V22h8v-.77l.63-.33C19.83 19.2 22 15.85 22 12c0-5.52-4.48-10-10-10z" />
            <circle cx="9" cy="12" r="1.5" fill="#ff2a2a" />
            <circle cx="15" cy="12" r="1.5" fill="#ff2a2a" />
            <path d="M10 16h4" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          The Graveyard
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 400,
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Where dead code gets resurrected.
        </div>

        {/* Bottom Tagline / Pill */}
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            fontSize: '18px',
            color: '#71717a',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#39ff14',
              display: 'flex',
            }}
          />
          <span>Liquidate, adopt, or partner on unfinished software</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
