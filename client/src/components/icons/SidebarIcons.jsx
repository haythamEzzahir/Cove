function IconFrame({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function DashboardIcon() {
  return (
    <IconFrame>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </IconFrame>
  );
}

export function MarketsIcon() {
  return (
    <IconFrame>
      <path d="M4 18.5h16" />
      <path d="M6.5 15.5 10 11l3 2.5 4.5-6" />
      <path d="M15.5 7.5h2.5V10" />
    </IconFrame>
  );
}

export function WatchlistIcon() {
  return (
    <IconFrame>
      <path d="m12 3.75 2.55 5.17 5.7.83-4.13 4.03.98 5.68L12 16.78l-5.1 2.68.98-5.68L3.75 9.75l5.7-.83L12 3.75Z" />
    </IconFrame>
  );
}

export function PortfolioIcon() {
  return (
    <IconFrame>
      <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
      <path d="M8 6.5V5.25A1.75 1.75 0 0 1 9.75 3.5h4.5A1.75 1.75 0 0 1 16 5.25V6.5" />
      <path d="M3.5 11.5h17" />
      <path d="M10 11.5v1.75h4V11.5" />
    </IconFrame>
  );
}

export function AlertsIcon() {
  return (
    <IconFrame>
      <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.1c0 .45-.13.89-.37 1.27L5.75 15h12.5l-1.38-2.63a2.7 2.7 0 0 1-.37-1.27V9A4.5 4.5 0 0 0 12 4.5Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </IconFrame>
  );
}

export function NewsIcon() {
  return (
    <IconFrame>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 12.5h8" />
      <path d="M8 16h5" />
      <rect x="6.5" y="8.5" width="0.5" height="0.5" fill="currentColor" stroke="none" />
      <rect x="6.5" y="12" width="0.5" height="0.5" fill="currentColor" stroke="none" />
      <rect x="6.5" y="15.5" width="0.5" height="0.5" fill="currentColor" stroke="none" />
    </IconFrame>
  );
}

export function SettingsIcon() {
  return (
    <IconFrame>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 4.25v2" />
      <path d="M12 17.75v2" />
      <path d="m6.5 6.5 1.4 1.4" />
      <path d="m16.1 16.1 1.4 1.4" />
      <path d="M4.25 12h2" />
      <path d="M17.75 12h2" />
      <path d="m6.5 17.5 1.4-1.4" />
      <path d="m16.1 7.9 1.4-1.4" />
    </IconFrame>
  );
}

export function LogoutIcon() {
  return (
    <IconFrame>
      <path d="M9 4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25H9" />
      <path d="M13 8.5 17 12l-4 3.5" />
      <path d="M10 12h7" />
    </IconFrame>
  );
}
