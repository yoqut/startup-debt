const base = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconWallet({ size = 20, className }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M21 7H5a2 2 0 0 1 0-4h13v4" />
      <path d="M3 7v11a2 2 0 0 0 2 2h16v-8H5a2 2 0 0 1-2-2Z" />
      <circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSettings({ size = 18, className }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.65 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.65a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.35 9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 0 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

export function IconX({ size = 16, className }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function IconCheck({ size = 16, className }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconArrowUpRight({ size = 16, className }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export function IconArrowDownRight({ size = 16, className }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M7 7l10 10" />
      <path d="M17 7v10H7" />
    </svg>
  );
}

export function IconCart({ size = 16, className }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 8H6" />
    </svg>
  );
}

export function IconSend({ size = 16, className }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" />
    </svg>
  );
}

export function IconReceipt({ size = 28, className }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M6 2h12a1 1 0 0 1 1 1v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3a1 1 0 0 1 1-1Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

export function IconUser({ size = 13, className }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconPlus({ size = 26, className }) {
  return (
    <svg {...base} width={size} height={size} className={className} strokeWidth={2.4}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
