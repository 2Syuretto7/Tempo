import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-white text-[#0d0d0d] hover:bg-[#e6e6e6] font-medium rounded-[2px] h-10 px-5",
  secondary: "bg-page text-ink border border-white hover:bg-overlay font-medium rounded-[2px] h-10 px-5",
  ghost: "bg-transparent text-body hover:text-ink rounded-[2px] h-10 px-3",
};

export function Button({ variant = "primary", className = "", children, chevron, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; chevron?: boolean }) {
  return (
    <button
      {...rest}
      className={`group inline-flex items-center justify-center gap-2 text-[16px] transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-40 disabled:pointer-events-none ${styles[variant]} ${className}`}
    >
      {children}
      {chevron && <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden>›</span>}
    </button>
  );
}
