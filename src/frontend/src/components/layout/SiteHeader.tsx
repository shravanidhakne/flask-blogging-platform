import { SignInButton } from "@/components/InternetIdentity";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, PenLine, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/profile", label: "Profile" },
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-subtle backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          data-ocid="nav.link"
          className="group flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={() => setMenuOpen(false)}
        >
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Ink <span className="text-primary">&amp;</span> Ember
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                data-ocid="nav.link"
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/new"
            data-ocid="nav.write_button"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-secondary hover:shadow-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <PenLine className="size-4" aria-hidden="true" />
            Write
          </Link>
          <SignInButton className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary/90 hover:shadow-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60" />
        </div>

        <button
          type="button"
          data-ocid="nav.toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="inline-flex size-10 items-center justify-center rounded-md text-foreground transition-smooth hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <nav
            aria-label="Mobile"
            className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                data-ocid="nav.link"
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium text-foreground transition-smooth hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/new"
              data-ocid="nav.write_button"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium text-primary transition-smooth hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <PenLine className="size-4" aria-hidden="true" />
              Write a post
            </Link>
            <div className="pt-2">
              <SignInButton className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
