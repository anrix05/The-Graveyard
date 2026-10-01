import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';
import { formatINR } from '@/lib/format';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ProjectOgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project: any = null;
  try {
    const { data } = await supabase
      .from('projects')
      .select('*, seller:profiles!seller_id(username)')
      .eq('id', id)
      .maybeSingle();
    project = data;
  } catch {
    // Fallback if DB fetch fails
  }

  if (!project) {
    // Default Graveyard fallback card
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
            color: '#ffffff',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: '48px', fontWeight: 700, marginBottom: '16px' }}>
            The Graveyard
          </div>
          <div style={{ fontSize: '24px', color: '#a1a1aa' }}>
            Where dead code gets resurrected.
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const mode = project.interaction_type || 'buy';
  const modeColors: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    buy: { bg: 'rgba(57, 255, 20, 0.15)', text: '#39ff14', label: 'For Sale', dot: '#39ff14' },
    adopt: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', label: 'Free Fork', dot: '#fbbf24' },
    collab: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', label: 'Seeking Partner', dot: '#60a5fa' },
  };
  const activeMode = modeColors[mode] || modeColors.buy;

  const priceLabel =
    mode === 'buy'
      ? formatINR(project.price_paise)
      : mode === 'adopt'
      ? 'Free'
      : 'Collaboration';

  const sellerName = project.seller?.username || 'operative';
  const title = (project.title || 'Untitled Project').slice(0, 75);
  const tagline = (project.tagline || '').slice(0, 140);

  const tombstone =
    project.abandoned_on || project.cause_of_death
      ? `Died ${project.abandoned_on ? new Date(project.abandoned_on).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'Unknown'} · ${(project.cause_of_death || 'Lost interest').replace(/_/g, ' ')}`
      : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(255, 42, 42, 0.14) 0%, rgba(9, 9, 11, 0.95) 55%, #09090b 100%)',
          padding: '64px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Subtle Frame Border */}
        <div
          style={{
            position: 'absolute',
            inset: '32px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
          }}
        />

        {/* Top Bar: Mode Pill & Price */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 20px',
              backgroundColor: activeMode.bg,
              border: `1px solid ${activeMode.text}40`,
              borderRadius: '9999px',
              color: activeMode.text,
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: activeMode.dot,
              }}
            />
            <span>{activeMode.label}</span>
          </div>

          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            {priceLabel}
          </div>
        </div>

        {/* Center: Title & Tagline & Tombstone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            {title}
          </div>

          {tagline ? (
            <div
              style={{
                fontSize: '24px',
                lineHeight: 1.4,
                color: '#a1a1aa',
                fontWeight: 400,
              }}
            >
              {tagline}
            </div>
          ) : null}

          {tombstone ? (
            <div
              style={{
                fontSize: '18px',
                color: '#71717a',
                fontFamily: 'monospace',
                marginTop: '8px',
              }}
            >
              {tombstone}
            </div>
          ) : null}
        </div>

        {/* Bottom Footer: Seller & The Graveyard Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '20px',
              color: '#d4d4d8',
            }}
          >
            <span style={{ color: '#71717a' }}>Listed by</span>
            <span style={{ fontWeight: 600 }}>@{sellerName}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '20px',
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '14px',
                backgroundColor: '#ff2a2a',
                borderRadius: '2px',
                display: 'flex',
              }}
            />
            <span>The Graveyard</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
