import { Link } from "@tanstack/react-router";
import { SiFacebook, SiInstagram, SiX } from "react-icons/si";

const FOOTER_LINKS = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/new", label: "Write" },
  { to: "/profile", label: "Profile" },
] as const;

const SOCIALS = [
  { href: "https://x.com", label: "X", Icon: SiX },
  { href: "https://instagram.com", label: "Instagram", Icon: SiInstagram },
  { href: "https://facebook.com", label: "Facebook", Icon: SiFacebook },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  const caffeineHref = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
    typeof window === "undefined" ? "" : window.location.hostname,
  )}`;

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <p className="font-display text-xl font-bold tracking-tight text-foreground">
            Ink <span className="text-primary">&amp;</span> Ember
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Exploring the intersections of culture, design, and thoughtful
            narratives.
          </p>
        </div>

        <nav aria-label="Footer" className="space-y-3">
          <p className="label-ember">Explore</p>
          <ul className="space-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  data-ocid="footer.link"
                  className="text-sm text-muted-foreground transition-smooth hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <p className="label-ember">Follow</p>
          <ul className="flex items-center gap-3">
            {SOCIALS.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  data-ocid="footer.link"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-smooth hover:text-primary hover:shadow-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Icon className="size-4" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {year}. Built with love using{" "}
            <a
              href={caffeineHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <p className="font-mono">Stories worth your time</p>
        </div>
      </div>
    </footer>
  );
}
