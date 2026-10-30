import type { ReactNode } from "react";

export const AUTHOR = "Tanmay Vaswani";
export const SOURCE_URL = "https://github.com/TanmayVasvani/ops-sync";

export function Shell({ children, project }: { children: ReactNode; project: string }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="safe-top sticky z-20 border-b border-line bg-paper">
        <div className="gutter mx-auto flex max-w-6xl items-center justify-between gap-4 py-3">
          <p className="truncate font-display text-xl leading-none md:text-2xl">{project}</p>
          <a href={SOURCE_URL} className="text-sm underline decoration-line underline-offset-4">Source</a>
        </div>
      </header>
      <main className="gutter mx-auto max-w-6xl py-8 md:py-12">{children}</main>
      <footer className="gutter mx-auto max-w-6xl border-t border-line py-8 text-sm text-muted">
        <p>{AUTHOR} · 2026</p>
      </footer>
    </div>
  );
}
