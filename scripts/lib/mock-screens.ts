import sharp from 'sharp';

export type ScreenVariant = 'dashboard' | 'table' | 'settings';

interface MockScreenOptions {
  mode: 'buy' | 'adopt' | 'collab';
  variantIndex: 1 | 2 | 3;
}

/**
 * Generates an SVG wireframe string without relying on any system fonts.
 * Uses geometric rectangles, rounded pills, stat bars, and charts tinted
 * with the interaction mode accent color.
 */
function generateSvgWireframe(options: MockScreenOptions): string {
  const { mode, variantIndex } = options;

  const accentColor =
    mode === 'buy' ? '#39ff14' : mode === 'adopt' ? '#fbbf24' : '#3b82f6';
  const accentDim =
    mode === 'buy' ? 'rgba(57,255,20,0.15)' : mode === 'adopt' ? 'rgba(251,191,36,0.15)' : 'rgba(59,130,246,0.15)';
  const accentBorder =
    mode === 'buy' ? 'rgba(57,255,20,0.35)' : mode === 'adopt' ? 'rgba(251,191,36,0.35)' : 'rgba(59,130,246,0.35)';

  if (variantIndex === 1) {
    // VARIANT 1: ANALYTICS & STATS DASHBOARD
    return `
      <svg width="1280" height="800" viewBox="0 0 1280 800" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="1280" height="800" fill="#0A0A0B"/>
        
        <!-- Sidebar -->
        <rect x="0" y="0" width="220" height="800" fill="#111113" stroke="#1E1E22" stroke-width="1"/>
        <circle cx="40" cy="40" r="14" fill="${accentColor}" fill-opacity="0.8"/>
        <rect x="66" y="32" width="90" height="16" rx="8" fill="#FFFFFF" fill-opacity="0.9"/>
        
        <rect x="24" y="96" width="172" height="34" rx="8" fill="${accentDim}" stroke="${accentBorder}" stroke-width="1"/>
        <rect x="42" y="107" width="70" height="12" rx="6" fill="${accentColor}"/>
        
        <rect x="24" y="142" width="172" height="34" rx="8" fill="#18181B"/>
        <rect x="42" y="153" width="95" height="12" rx="6" fill="#71717A"/>
        
        <rect x="24" y="188" width="172" height="34" rx="8" fill="#18181B"/>
        <rect x="42" y="199" width="80" height="12" rx="6" fill="#71717A"/>
        
        <rect x="24" y="234" width="172" height="34" rx="8" fill="#18181B"/>
        <rect x="42" y="245" width="110" height="12" rx="6" fill="#71717A"/>
        
        <!-- Top Navigation Bar -->
        <rect x="220" y="0" width="1060" height="64" fill="#0E0E10" stroke="#1E1E22" stroke-width="1"/>
        <rect x="250" y="20" width="240" height="24" rx="6" fill="#18181B"/>
        <rect x="1170" y="18" width="28" height="28" rx="14" fill="#27272A"/>
        <circle cx="1226" cy="32" r="16" fill="${accentColor}" fill-opacity="0.3" stroke="${accentColor}" stroke-width="2"/>

        <!-- Main Dashboard Header -->
        <rect x="260" y="96" width="180" height="28" rx="6" fill="#FFFFFF" fill-opacity="0.9"/>
        <rect x="260" y="132" width="320" height="14" rx="4" fill="#71717A"/>
        
        <!-- 3 Stat Metric Cards -->
        <g transform="translate(260, 170)">
          <!-- Card 1 -->
          <rect x="0" y="0" width="310" height="120" rx="16" fill="#141416" stroke="#222226" stroke-width="1"/>
          <rect x="24" y="24" width="70" height="12" rx="6" fill="#71717A"/>
          <rect x="24" y="48" width="120" height="32" rx="6" fill="#FFFFFF"/>
          <rect x="24" y="90" width="80" height="10" rx="5" fill="${accentColor}"/>
          
          <!-- Card 2 -->
          <rect x="330" y="0" width="310" height="120" rx="16" fill="#141416" stroke="#222226" stroke-width="1"/>
          <rect x="354" y="24" width="90" height="12" rx="6" fill="#71717A"/>
          <rect x="354" y="48" width="140" height="32" rx="6" fill="#FFFFFF"/>
          <rect x="354" y="90" width="65" height="10" rx="5" fill="${accentColor}"/>
          
          <!-- Card 3 -->
          <rect x="660" y="0" width="310" height="120" rx="16" fill="#141416" stroke="#222226" stroke-width="1"/>
          <rect x="684" y="24" width="80" height="12" rx="6" fill="#71717A"/>
          <rect x="684" y="48" width="110" height="32" rx="6" fill="#FFFFFF"/>
          <rect x="684" y="90" width="95" height="10" rx="5" fill="${accentColor}"/>
        </g>
        
        <!-- Large Chart Panel -->
        <rect x="260" y="320" width="970" height="420" rx="20" fill="#121214" stroke="#222226" stroke-width="1"/>
        <rect x="290" y="350" width="140" height="18" rx="6" fill="#FFFFFF" fill-opacity="0.8"/>
        <rect x="290" y="378" width="220" height="12" rx="4" fill="#52525B"/>
        
        <!-- Chart Grid Lines -->
        <line x1="290" y1="440" x2="1190" y2="440" stroke="#1E1E22" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="290" y1="510" x2="1190" y2="510" stroke="#1E1E22" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="290" y1="580" x2="1190" y2="580" stroke="#1E1E22" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="290" y1="650" x2="1190" y2="650" stroke="#1E1E22" stroke-width="1"/>
        
        <!-- Bar Chart columns -->
        <rect x="330" y="550" width="34" height="100" rx="6" fill="#27272A"/>
        <rect x="400" y="490" width="34" height="160" rx="6" fill="#27272A"/>
        <rect x="470" y="430" width="34" height="220" rx="6" fill="${accentColor}" fill-opacity="0.85"/>
        <rect x="540" y="520" width="34" height="130" rx="6" fill="#27272A"/>
        <rect x="610" y="470" width="34" height="180" rx="6" fill="#27272A"/>
        <rect x="680" y="390" width="34" height="260" rx="6" fill="${accentColor}"/>
        <rect x="750" y="460" width="34" height="190" rx="6" fill="#27272A"/>
        <rect x="820" y="510" width="34" height="140" rx="6" fill="#27272A"/>
        <rect x="890" y="440" width="34" height="210" rx="6" fill="${accentColor}" fill-opacity="0.85"/>
        <rect x="960" y="480" width="34" height="170" rx="6" fill="#27272A"/>
        <rect x="1030" y="420" width="34" height="230" rx="6" fill="#27272A"/>
        <rect x="1100" y="380" width="34" height="270" rx="6" fill="${accentColor}"/>
      </svg>
    `;
  }

  if (variantIndex === 2) {
    // VARIANT 2: DATA TABLE & LIST/DETAIL EXPLORER
    return `
      <svg width="1280" height="800" viewBox="0 0 1280 800" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="1280" height="800" fill="#0A0A0B"/>
        
        <!-- Sidebar -->
        <rect x="0" y="0" width="220" height="800" fill="#111113" stroke="#1E1E22" stroke-width="1"/>
        <circle cx="40" cy="40" r="14" fill="${accentColor}" fill-opacity="0.8"/>
        <rect x="66" y="32" width="90" height="16" rx="8" fill="#FFFFFF" fill-opacity="0.9"/>
        
        <rect x="24" y="96" width="172" height="34" rx="8" fill="#18181B"/>
        <rect x="42" y="107" width="80" height="12" rx="6" fill="#71717A"/>
        
        <rect x="24" y="142" width="172" height="34" rx="8" fill="${accentDim}" stroke="${accentBorder}" stroke-width="1"/>
        <rect x="42" y="153" width="90" height="12" rx="6" fill="${accentColor}"/>
        
        <rect x="24" y="188" width="172" height="34" rx="8" fill="#18181B"/>
        <rect x="42" y="199" width="105" height="12" rx="6" fill="#71717A"/>
        
        <!-- Header -->
        <rect x="220" y="0" width="1060" height="64" fill="#0E0E10" stroke="#1E1E22" stroke-width="1"/>
        <rect x="260" y="96" width="200" height="28" rx="6" fill="#FFFFFF"/>
        <rect x="260" y="132" width="340" height="14" rx="4" fill="#71717A"/>
        
        <!-- Action Row -->
        <rect x="260" y="170" width="320" height="40" rx="8" fill="#141416" stroke="#222226" stroke-width="1"/>
        <rect x="1100" y="170" width="130" height="40" rx="20" fill="${accentColor}"/>
        
        <!-- Data Table Card -->
        <rect x="260" y="230" width="970" height="510" rx="16" fill="#121214" stroke="#222226" stroke-width="1"/>
        
        <!-- Table Header Row -->
        <rect x="260" y="230" width="970" height="48" rx="16" fill="#18181B"/>
        <rect x="290" y="248" width="80" height="12" rx="4" fill="#A1A1AA"/>
        <rect x="450" y="248" width="90" height="12" rx="4" fill="#A1A1AA"/>
        <rect x="650" y="248" width="70" height="12" rx="4" fill="#A1A1AA"/>
        <rect x="850" y="248" width="80" height="12" rx="4" fill="#A1A1AA"/>
        <rect x="1080" y="248" width="60" height="12" rx="4" fill="#A1A1AA"/>
        
        <!-- Rows -->
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => `
          <g transform="translate(0, ${278 + i * 62})">
            <line x1="260" y1="0" x2="1230" y2="0" stroke="#1E1E22" stroke-width="1"/>
            <rect x="290" y="20" width="110" height="14" rx="5" fill="#FFFFFF"/>
            <rect x="450" y="20" width="150" height="14" rx="5" fill="#71717A"/>
            <rect x="650" y="18" width="75" height="18" rx="9" fill="${accentDim}" stroke="${accentBorder}" stroke-width="1"/>
            <rect x="850" y="20" width="95" height="14" rx="5" fill="#A1A1AA"/>
            <circle cx="1110" cy="27" r="12" fill="#222226"/>
          </g>
        `).join('')}
      </svg>
    `;
  }

  // VARIANT 3: FORMS & SETTINGS / CONFIGURATION
  return `
    <svg width="1280" height="800" viewBox="0 0 1280 800" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="800" fill="#0A0A0B"/>
      
      <!-- Sidebar -->
      <rect x="0" y="0" width="220" height="800" fill="#111113" stroke="#1E1E22" stroke-width="1"/>
      <circle cx="40" cy="40" r="14" fill="${accentColor}" fill-opacity="0.8"/>
      <rect x="66" y="32" width="90" height="16" rx="8" fill="#FFFFFF" fill-opacity="0.9"/>
      
      <rect x="24" y="96" width="172" height="34" rx="8" fill="#18181B"/>
      <rect x="42" y="107" width="80" height="12" rx="6" fill="#71717A"/>
      
      <rect x="24" y="142" width="172" height="34" rx="8" fill="#18181B"/>
      <rect x="42" y="153" width="90" height="12" rx="6" fill="#71717A"/>
      
      <rect x="24" y="188" width="172" height="34" rx="8" fill="${accentDim}" stroke="${accentBorder}" stroke-width="1"/>
      <rect x="42" y="199" width="75" height="12" rx="6" fill="${accentColor}"/>
      
      <!-- Header -->
      <rect x="220" y="0" width="1060" height="64" fill="#0E0E10" stroke="#1E1E22" stroke-width="1"/>
      <rect x="260" y="96" width="190" height="28" rx="6" fill="#FFFFFF"/>
      
      <!-- Settings Form Layout: 2 Columns -->
      <g transform="translate(260, 160)">
        <!-- Left Panel: General Settings -->
        <rect x="0" y="0" width="460" height="580" rx="16" fill="#121214" stroke="#222226" stroke-width="1"/>
        <rect x="30" y="30" width="160" height="18" rx="5" fill="#FFFFFF"/>
        <rect x="30" y="60" width="280" height="12" rx="4" fill="#71717A"/>
        
        <rect x="30" y="100" width="90" height="12" rx="4" fill="#A1A1AA"/>
        <rect x="30" y="122" width="400" height="42" rx="8" fill="#18181B" stroke="#27272A" stroke-width="1"/>
        
        <rect x="30" y="186" width="110" height="12" rx="4" fill="#A1A1AA"/>
        <rect x="30" y="208" width="400" height="42" rx="8" fill="#18181B" stroke="#27272A" stroke-width="1"/>
        
        <rect x="30" y="272" width="120" height="12" rx="4" fill="#A1A1AA"/>
        <rect x="30" y="294" width="400" height="110" rx="8" fill="#18181B" stroke="#27272A" stroke-width="1"/>
        
        <rect x="30" y="440" width="120" height="40" rx="20" fill="${accentColor}"/>
        
        <!-- Right Panel: Integration & Telemetry -->
        <rect x="490" y="0" width="480" height="580" rx="16" fill="#121214" stroke="#222226" stroke-width="1"/>
        <rect x="520" y="30" width="180" height="18" rx="5" fill="#FFFFFF"/>
        <rect x="520" y="60" width="240" height="12" rx="4" fill="#71717A"/>
        
        <!-- Key/Value rows with toggle switches -->
        ${[0, 1, 2, 3].map((j) => `
          <g transform="translate(520, ${110 + j * 90})">
            <rect x="0" y="0" width="420" height="70" rx="10" fill="#18181B" stroke="#222226" stroke-width="1"/>
            <rect x="20" y="18" width="130" height="14" rx="5" fill="#FFFFFF"/>
            <rect x="20" y="40" width="210" height="10" rx="4" fill="#71717A"/>
            <rect x="350" y="22" width="46" height="26" rx="13" fill="${j % 2 === 0 ? accentColor : '#27272A'}"/>
            <circle cx="${j % 2 === 0 ? 383 : 363}" cy="35" r="9" fill="#FFFFFF"/>
          </g>
        `).join('')}
      </g>
    </svg>
  `;
}

/**
 * Returns a 1280x800 WebP Buffer rendered from procedurally generated SVG.
 */
export async function generateScreenshotBuffer(
  mode: 'buy' | 'adopt' | 'collab',
  variantIndex: 1 | 2 | 3
): Promise<Buffer> {
  const svg = generateSvgWireframe({ mode, variantIndex });
  return await sharp(Buffer.from(svg))
    .webp({ quality: 80 })
    .toBuffer();
}
