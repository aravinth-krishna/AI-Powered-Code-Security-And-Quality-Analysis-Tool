const s = {
  width: "1em",
  height: "1em",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  style: { verticalAlign: "-0.125em" } as React.CSSProperties,
};

export const IconLogo = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <polyline points="9 9 7 12 9 15" />
    <polyline points="15 9 17 12 15 15" />
  </svg>
);

export const IconShield = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
export const IconScan = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M3 7V5a2 2 0 012-2h2" />
    <path d="M17 3h2a2 2 0 012 2v2" />
    <path d="M21 17v2a2 2 0 01-2 2h-2" />
    <path d="M7 21H5a2 2 0 01-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);
export const IconHistory = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
export const IconUser = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
export const IconSettings = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
export const IconLogOut = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
export const IconZap = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <polygon
      points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);
export const IconMicroscope = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M6 18h8" />
    <path d="M3 22h18" />
    <path d="M14 22a7 7 0 00-7-7" />
    <path d="M9 14h.01" />
    <path d="M9 6v8" />
    <path
      d="M9 2a2 2 0 012 2v0a2 2 0 01-2 2H7a2 2 0 01-2-2v0a2 2 0 012-2z"
      fill="none"
    />
    <path d="M12 6l3-3" />
  </svg>
);
export const IconCheckCircle = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
export const IconSearch = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
export const IconBarChart = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);
export const IconTarget = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
export const IconCode = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);
export const IconBookOpen = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);
export const IconPlay = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
  </svg>
);

// Category icons
export const IconLock = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
export const IconCpu = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);
export const IconDatabase = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);
export const IconAlertTriangle = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
export const IconTool = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  </svg>
);
export const IconFilter = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
export const IconChevronDown = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
export const IconChevronRight = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
export const IconClipboard = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

// Additional icons
export const IconUpload = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
export const IconGithub = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
  </svg>
);
export const IconMaximize = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);
export const IconMinimize = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);
export const IconTrash = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);
export const IconX = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
export const IconArrowLeft = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
export const IconFile = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);
export const IconFolder = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);
export const IconDownload = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
export const IconMail = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22 6 12 13 2 6" />
  </svg>
);
export const IconCalendar = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
export const IconKey = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);
