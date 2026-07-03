"use client";

import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/types";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-line bg-surface/80 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxblood/40";
  const sizes = { sm: "h-8 px-3.5 text-xs", md: "h-10 px-5 text-sm" };
  const variants = {
    primary:
      "bg-oxblood text-[#fbf6ec] shadow-sm hover:bg-oxblood-deep hover:shadow-md active:scale-[0.98]",
    outline:
      "border border-border-line bg-surface/60 text-ink hover:border-oxblood hover:text-oxblood",
    ghost: "text-ink-soft hover:bg-surface-2 hover:text-ink",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border-line bg-surface-2 px-2.5 py-0.5 font-mono text-[0.66rem] uppercase tracking-wider text-ink-soft",
        className
      )}
    >
      {children}
    </span>
  );
}

const sevStyles: Record<Severity, { dot: string; text: string; ring: string; label: string }> = {
  high: { dot: "bg-sev-high", text: "text-sev-high", ring: "border-sev-high/30", label: "High" },
  medium: { dot: "bg-sev-med", text: "text-sev-med", ring: "border-sev-med/30", label: "Medium" },
  low: { dot: "bg-sev-low", text: "text-sev-low", ring: "border-sev-low/30", label: "Low" },
};

export function SeverityPill({ severity }: { severity: Severity }) {
  const s = sevStyles[severity] ?? sevStyles.low;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-surface px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider",
        s.ring,
        s.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-line bg-surface/40 px-8 py-16 text-center">
      {icon && <div className="mb-4 text-ink-faint">{icon}</div>}
      <p className="font-display text-lg text-ink">{title}</p>
      {hint && <p className="mt-1.5 max-w-sm text-sm text-ink-faint">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  index,
  title,
  desc,
}: {
  index: string;
  title: string;
  desc?: string;
}) {
  return (
    <div>
      <div className="kicker mb-2">{index}</div>
      <h2 className="font-display text-2xl font-medium tracking-tight text-ink">{title}</h2>
      {desc && <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{desc}</p>}
    </div>
  );
}
