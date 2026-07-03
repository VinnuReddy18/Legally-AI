"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "Overview" },
  { key: "documents", label: "Documents" },
  { key: "screening", label: "Screening" },
  { key: "drafting", label: "Drafting" },
  { key: "research", label: "Research" },
];

export function WorkspaceNav({ matterId }: { matterId: string }) {
  const pathname = usePathname();
  const base = `/matters/${matterId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const href = tab.key ? `${base}/${tab.key}` : base;
        const active = tab.key
          ? pathname.startsWith(href)
          : pathname === base;
        return (
          <Link
            key={tab.key || "overview"}
            href={href}
            className={cn(
              "relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
              active ? "text-oxblood" : "text-ink-soft hover:text-ink"
            )}
          >
            {tab.label}
            {active && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-oxblood"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
