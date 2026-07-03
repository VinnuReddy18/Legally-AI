import { Logo } from "./brand";
import { HealthBadge } from "./health-badge";
import { ThemeToggle } from "./theme-toggle";

export function TopBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-soft bg-paper/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <Logo />
        <div className="flex-1">{children}</div>
        <HealthBadge />
        <ThemeToggle />
      </div>
    </header>
  );
}
