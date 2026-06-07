"use client";

// Inline SVG logos for each connector — brand-accurate colors, no external CDN
const LOGOS: Record<string, (size: number) => React.ReactElement> = {
  ghl: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#1a1a1a"/>
      <text x="20" y="26" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Arial,sans-serif" fill="#22c55e">GHL</text>
    </svg>
  ),
  meta_ads: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#1877F2"/>
      <path d="M8 21.5c0-3.6 1.6-5.5 3.4-5.5 1.7 0 2.7 1.1 4.1 3.3l2.5 4 2.5-4c1.4-2.2 2.4-3.3 4.1-3.3 1.8 0 3.4 1.9 3.4 5.5 0 3.5-1.5 5.5-3.4 5.5-1.2 0-2.2-.7-3.6-2.8L20 22.5l-1 1.7c-1.4 2.1-2.4 2.8-3.6 2.8C13.5 27 12 25 12 21.5h-4z" fill="white" transform="translate(0,0) scale(1)"/>
      <ellipse cx="20" cy="21" rx="12" ry="7" fill="none" stroke="white" strokeWidth="2.5"/>
    </svg>
  ),
  google_ads: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#fff"/>
      <circle cx="13" cy="27" r="5" fill="#FBBC04"/>
      <circle cx="27" cy="27" r="5" fill="#34A853"/>
      <circle cx="20" cy="13" r="5" fill="#4285F4"/>
    </svg>
  ),
  google_calendar: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#fff"/>
      <rect x="7" y="10" width="26" height="24" rx="2" fill="#fff" stroke="#e0e0e0" strokeWidth="1.5"/>
      <rect x="7" y="10" width="26" height="8" rx="2" fill="#EA4335"/>
      <rect x="7" y="16" width="26" height="2" fill="#EA4335"/>
      <text x="20" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="Arial,sans-serif" fill="#1a73e8">20</text>
      <rect x="13" y="7" width="3" height="6" rx="1.5" fill="#EA4335"/>
      <rect x="24" y="7" width="3" height="6" rx="1.5" fill="#EA4335"/>
    </svg>
  ),
  gmail: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#fff"/>
      <path d="M6 12h28v18a2 2 0 01-2 2H8a2 2 0 01-2-2V12z" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
      <path d="M6 12l14 10L34 12" stroke="#EA4335" strokeWidth="2.5" fill="none"/>
      <path d="M6 12v2l14 9 14-9v-2H6z" fill="#EA4335"/>
      <path d="M6 14v16" stroke="#4285F4" strokeWidth="2" fill="none"/>
      <path d="M34 14v16" stroke="#34A853" strokeWidth="2" fill="none"/>
    </svg>
  ),
  google_drive: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#fff"/>
      <path d="M20 8L33 30H7L20 8z" fill="none"/>
      <path d="M20 8l7 12H13L20 8z" fill="#4285F4"/>
      <path d="M13 20l-6 10h12l-6-10z" fill="#FBBC04"/>
      <path d="M27 20l6 10H21l6-10z" fill="#34A853"/>
    </svg>
  ),
  notion: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#fff"/>
      <path d="M11 9h14l6 6v17a1 1 0 01-1 1H11a1 1 0 01-1-1V10a1 1 0 011-1z" fill="#fff" stroke="#e0e0e0" strokeWidth="1.5"/>
      <path d="M25 9v6h6" stroke="#e0e0e0" strokeWidth="1.5" fill="none"/>
      <text x="20" y="26" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Georgia,serif" fill="#000">N</text>
    </svg>
  ),
  airtable: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#18BFFF"/>
      <rect x="8" y="8" width="11" height="11" rx="2" fill="#FCB400"/>
      <rect x="21" y="8" width="11" height="11" rx="2" fill="#fff" fillOpacity="0.9"/>
      <rect x="8" y="21" width="11" height="11" rx="2" fill="#F82B60"/>
      <rect x="21" y="21" width="11" height="11" rx="2" fill="#fff" fillOpacity="0.7"/>
    </svg>
  ),
  whatsapp: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#25D366"/>
      <path d="M20 8C13.4 8 8 13.4 8 20c0 2.1.5 4.1 1.5 5.9L8 32l6.3-1.5c1.7.9 3.7 1.5 5.7 1.5 6.6 0 12-5.4 12-12S26.6 8 20 8zm0 22c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-3.7.9.9-3.6-.2-.4C10.5 23.7 10 21.9 10 20c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10z" fill="white"/>
      <path d="M25 22.5c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4.1-3.5-.3-.5.3-.5.9-1.7.1-.2.1-.4-.1-.5-.1-.1-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.3.2-.7.2-1.2.1-1.3-.1-.2-.3-.2-.6-.3z" fill="white"/>
    </svg>
  ),
  instagram: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F58529"/>
          <stop offset="25%" stopColor="#DD2A7B"/>
          <stop offset="75%" stopColor="#8134AF"/>
          <stop offset="100%" stopColor="#515BD4"/>
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="8" fill="url(#ig-grad)"/>
      <rect x="9" y="9" width="22" height="22" rx="6" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="20" r="5" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="27" cy="13" r="1.5" fill="white"/>
    </svg>
  ),
  facebook_pages: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#1877F2"/>
      <path d="M22 32v-9h3l.5-3.5H22v-2c0-1 .5-2 2-2h2v-3s-1-.5-3-.5c-3 0-5 2-5 5v2.5h-3V23h3v9h4z" fill="white"/>
    </svg>
  ),
  tiktok: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#000"/>
      <path d="M24 8h-3.5v16.5a3.5 3.5 0 01-3.5 3.5 3.5 3.5 0 01-3.5-3.5 3.5 3.5 0 013.5-3.5c.3 0 .7.1 1 .2V17.6c-.3 0-.7-.1-1-.1a7 7 0 00-7 7 7 7 0 007 7 7 7 0 007-7V15.5a9.8 9.8 0 005.5 1.5V13.5A6.5 6.5 0 0124 8z" fill="white"/>
      <path d="M24 8h-3.5v16.5a3.5 3.5 0 01-3.5 3.5 3.5 3.5 0 01-3.5-3.5 3.5 3.5 0 013.5-3.5c.3 0 .7.1 1 .2V17.6c-.3 0-.7-.1-1-.1a7 7 0 00-7 7 7 7 0 007 7 7 7 0 007-7V15.5a9.8 9.8 0 005.5 1.5V13.5A6.5 6.5 0 0124 8z" fill="#FF004F" fillOpacity="0.6" transform="translate(1,1)"/>
      <path d="M24 8h-3.5v16.5a3.5 3.5 0 01-3.5 3.5 3.5 3.5 0 01-3.5-3.5 3.5 3.5 0 013.5-3.5c.3 0 .7.1 1 .2V17.6c-.3 0-.7-.1-1-.1a7 7 0 00-7 7 7 7 0 007 7 7 7 0 007-7V15.5a9.8 9.8 0 005.5 1.5V13.5A6.5 6.5 0 0124 8z" fill="#00F2EA" fillOpacity="0.6" transform="translate(-1,-1)"/>
    </svg>
  ),
  linkedin: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#0A66C2"/>
      <rect x="8" y="14" width="6" height="18" rx="1" fill="white"/>
      <circle cx="11" cy="10" r="3" fill="white"/>
      <path d="M18 14h5v2.5s1.5-2.5 5-2.5c4 0 5 2.5 5 6V32h-6v-10c0-1.5-.5-3-2.5-3s-2.5 1.5-2.5 3V32H18V14z" fill="white"/>
    </svg>
  ),
  stripe: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#635BFF"/>
      <path d="M18 17.5c0-1.2 1-2 2.5-2 2.2 0 4.5 1.5 4.5 1.5V13s-2-1-4.5-1c-4 0-7 2.2-7 5.7 0 6 7.5 5.2 7.5 8 0 1.4-1.2 2.2-3 2.2-2.5 0-5-1.7-5-1.7V30s2.2 1 5.2 1c4 0 7-2 7-5.8 0-6.4-7.2-5.2-7.2-7.7z" fill="white"/>
    </svg>
  ),
  github: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#24292e"/>
      <path d="M20 7C13 7 7 13 7 20c0 5.7 3.7 10.6 8.8 12.3.6.1.8-.3.8-.6v-2.1c-3.5.8-4.2-1.6-4.2-1.6-.6-1.5-1.4-1.9-1.4-1.9-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.8-.3-5.7-1.4-5.7-6.2 0-1.4.5-2.5 1.3-3.4-.1-.3-.6-1.6.1-3.3 0 0 1.1-.3 3.5 1.3a12 12 0 016.4 0c2.4-1.6 3.5-1.3 3.5-1.3.7 1.7.3 3 .1 3.3.8.9 1.3 2 1.3 3.4 0 4.8-2.9 5.9-5.7 6.2.5.4.9 1.2.9 2.4v3.5c0 .3.2.7.8.6C29.3 30.6 33 25.7 33 20c0-7-6-13-13-13z" fill="white"/>
    </svg>
  ),
  vercel: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#000"/>
      <path d="M20 8L34 32H6L20 8z" fill="white"/>
    </svg>
  ),
  slack: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#4A154B"/>
      <path d="M16 10a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-5 0v-7A2.5 2.5 0 0116 10zm8 0a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-5 0v-7A2.5 2.5 0 0124 10zM10 16a2.5 2.5 0 012.5 2.5H20a2.5 2.5 0 010 5h-7.5A2.5 2.5 0 0110 21v-2.5A2.5 2.5 0 0110 16zm20 0a2.5 2.5 0 012.5 2.5v2.5a2.5 2.5 0 01-2.5 2.5H22.5a2.5 2.5 0 010-5H30zM16 22.5a2.5 2.5 0 012.5 2.5v5a2.5 2.5 0 01-5 0v-5A2.5 2.5 0 0116 22.5zm8 0a2.5 2.5 0 012.5 2.5v5a2.5 2.5 0 01-5 0v-5A2.5 2.5 0 0124 22.5z" fill="white"/>
    </svg>
  ),
  zapier: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#FF4A00"/>
      <path d="M21 8h-2v7l-6-7H8v2l10 10H8v2h13v-7l7 7h5v-2L23 10h7V8H21z" fill="white"/>
    </svg>
  ),
  make: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#6D00CC"/>
      <circle cx="12" cy="20" r="5" fill="none" stroke="white" strokeWidth="2"/>
      <circle cx="28" cy="20" r="5" fill="none" stroke="white" strokeWidth="2"/>
      <path d="M17 20h6" stroke="white" strokeWidth="2"/>
    </svg>
  ),
  n8n: (s) => (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#EA4B71"/>
      <text x="20" y="26" textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="Arial,sans-serif" fill="white">n8n</text>
    </svg>
  ),
};

interface ConnectorLogoProps {
  id: string;
  size?: number;
  style?: React.CSSProperties;
}

export default function ConnectorLogo({ id, size = 36, style }: ConnectorLogoProps) {
  const render = LOGOS[id];
  if (!render) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 8,
        background: "#1a1a2e", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, color: "#888", ...style,
      }}>?</div>
    );
  }
  return <div style={{ flexShrink: 0, lineHeight: 0, ...style }}>{render(size)}</div>;
}
