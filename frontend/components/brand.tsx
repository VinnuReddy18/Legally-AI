import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-oxblood text-[#fbf6ec] shadow-sm transition-transform group-hover:-rotate-6">
        {/* Scales-of-justice glyph */}
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18M7 21h10M4 7h16M12 4l-8 3 3 6a3 3 0 0 1-6 0M20 7l-8-3M20 7l3 6a3 3 0 0 1-6 0" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          Legally
        </span>
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.28em] text-ink-faint">
          Counsel OS
        </span>
      </span>
    </Link>
  );
}
