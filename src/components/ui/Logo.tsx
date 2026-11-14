/** Tempo's mark: a 2 x 2 board with one square lit, the next move. */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="0.5" y="0.5" width="19" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <rect x="2.5" y="2.5" width="7" height="7" fill="currentColor" opacity="0.9" />
      <rect x="10.5" y="10.5" width="7" height="7" fill="var(--purple-400)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <Logo />
      <span className="text-[17px] font-medium tracking-[-0.03em]">Tempo</span>
    </span>
  );
}
