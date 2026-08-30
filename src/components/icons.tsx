/* Hand-drawn inline icon set — stroke-based, inherits currentColor. */

interface IconProps {
  className?: string;
}

const base = (className?: string) => ({
  className,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
});

export const IconFingerprint = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 4.5C7.6 4.5 4 8 4 12.4V19" />
    <path d="M12 7.6c-2.8 0-5 2.2-5 5v6.1" />
    <path d="M12 10.8c-1 0-1.9.8-1.9 1.9v6.4" />
    <path d="M15.2 9.4v6.8" />
    <path d="M18.3 11.6V19" />
    <path d="M20 14.5V19" />
  </svg>
);

export const IconMagnifier = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15.2 15.2 20.5 20.5" />
    <path d="M8 10.5a2.5 2.5 0 0 1 2.5-2.5" />
  </svg>
);

export const IconDice = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <circle cx="9" cy="9" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="15" cy="15" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9" r="1.15" fill="currentColor" stroke="none" />
    <circle cx="9" cy="15" r="1.15" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPrint = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M7 8V4h10v4" />
    <rect x="4" y="8" width="16" height="8" rx="1.5" />
    <path d="M7 13h10v7H7z" />
    <path d="M17 11h.5" />
  </svg>
);

export const IconDownload = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 4v10" />
    <path d="m8 10.5 4 4 4-4" />
    <path d="M5 19.5h14" />
  </svg>
);

export const IconLayers = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m12 3.5 8 4.2-8 4.2-8-4.2z" />
    <path d="m4.5 12 7.5 4 7.5-4" />
    <path d="m4.5 16 7.5 4 7.5-4" />
  </svg>
);

export const IconCheck = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m4.5 12.5 5 5L19.5 7" />
  </svg>
);

export const IconX = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconTrash = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M5 7h14" />
    <path d="M9.5 7V4.5h5V7" />
    <path d="M6.5 7l1 13h9l1-13" />
    <path d="M10 11v5.5M14 11v5.5" />
  </svg>
);

export const IconCopy = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 5.5v-.7A1.8 1.8 0 0 0 13.7 3H6.3a1.8 1.8 0 0 0-1.8 1.8v7.4a1.8 1.8 0 0 0 1.8 1.8h.7" />
  </svg>
);

export const IconBolt = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M13 3 5.5 13.5H11L10 21l8-11h-5.5z" />
  </svg>
);

export const IconEye = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

export const IconEyeOff = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M5 5l14 14" />
    <path d="M9.9 5.4A8.8 8.8 0 0 1 12 5c5.5 0 9 6.5 9 6.5a16.6 16.6 0 0 1-3.2 3.7M6 7.3A15.4 15.4 0 0 0 3 11.5S6.5 18 12 18c1 0 2-.2 2.9-.6" />
  </svg>
);

export const IconEraser = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m8 19-4.2-4.2a1.6 1.6 0 0 1 0-2.3l7.5-7.5a1.6 1.6 0 0 1 2.3 0l5.6 5.6a1.6 1.6 0 0 1 0 2.3L11.5 20.6a1.6 1.6 0 0 1-1.2.5H8z" />
    <path d="m8.5 8.5 7 7" />
    <path d="M12.5 19.9H20" />
  </svg>
);

export const IconPlay = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M8 5.5v13l10-6.5z" />
  </svg>
);

export const IconBook = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M5 4.5h9a2.5 2.5 0 0 1 2.5 2.5v12.5H7A2 2 0 0 1 5 17.5z" />
    <path d="M16.5 17.5V19a1.5 1.5 0 0 1-3 0V7" />
    <path d="M8.5 9h5" />
  </svg>
);

export const IconLock = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconUnlock = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.9-.8" />
    <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconRedo = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5" />
    <path d="M20 4v4.5h-4.5" />
    <path d="M20 12a8 8 0 0 1-16 0" />
  </svg>
);

/* ---- theme icons ---- */

export const IconManor = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m4 11 8-6.5L20 11" />
    <path d="M6 10v9.5h12V10" />
    <path d="M10 19.5v-5h4v5" />
    <path d="M12 4.5v-2" />
  </svg>
);

export const IconShip = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M4 15.5h16l-2.5 4h-11z" />
    <path d="M12 4v11.5" />
    <path d="M12 5.5c4 1 6 4 6.5 8H12" />
    <path d="M12 7c-3 .9-4.6 3.2-5 6.5h5" />
  </svg>
);

export const IconCards = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="3.5" y="6" width="11" height="14" rx="1.8" transform="rotate(-8 9 13)" />
    <rect x="9.5" y="4.5" width="11" height="14" rx="1.8" transform="rotate(9 15 11.5)" />
    <path d="M13.6 9.8c.9-1.4 2.9-.8 2.9.6 0 1-1.4 2-2.6 2.9-1.1-1-2.4-2-2.4-3 0-1.3 1.9-1.9 2.1-.5z" transform="rotate(9 15 11.5)" />
  </svg>
);

export const IconMask = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M5 5c2.3 1 4.6 1.5 7 1.5S16.7 6 19 5v7.5c0 4.2-3.1 7-7 7s-7-2.8-7-7z" />
    <path d="M8.5 11h2M13.5 11h2" />
    <path d="M9 15.5c1.8 1.6 4.2 1.6 6 0" />
  </svg>
);

export const IconMountain = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m3 19 6.5-11L13 13l3-4.5L21 19z" />
    <path d="m9.5 8 1.6 2.2L12.8 8" />
    <path d="M3 19h18" />
  </svg>
);

export const IconFrame = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="4" y="4" width="16" height="16" rx="1.5" />
    <rect x="7.5" y="7.5" width="9" height="9" />
    <path d="m7.5 16.5 3-3.5 2 2 2-2.5 2 2.5" />
  </svg>
);

/* ---- evidence shapes (filled) ---- */

export const ShapeTriangle = ({ className }: IconProps) => (
  <svg viewBox="0 0 12 12" className={className}>
    <path d="M6 1.2 11 10.4H1z" fill="currentColor" />
  </svg>
);

export const ShapeCircle = ({ className }: IconProps) => (
  <svg viewBox="0 0 12 12" className={className}>
    <circle cx="6" cy="6" r="4.6" fill="currentColor" />
  </svg>
);

export const ShapeSquare = ({ className }: IconProps) => (
  <svg viewBox="0 0 12 12" className={className}>
    <rect x="1.6" y="1.6" width="8.8" height="8.8" fill="currentColor" />
  </svg>
);
