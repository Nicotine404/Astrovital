export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--primary)" fillOpacity="0.12" />
      <ellipse cx="16" cy="16" rx="11" ry="4.5" transform="rotate(-28 16 16)" stroke="var(--primary)" strokeOpacity="0.55" strokeWidth="1.3" />
      <path d="M6.5 17h5l2-4.5 3 8 2.5-5.5h6.5" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
