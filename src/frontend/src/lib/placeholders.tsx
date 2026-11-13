import type { ReactNode } from "react";

/**
 * Temporary route placeholders.
 *
 * The page tasks own `src/frontend/src/pages/*` and will replace each of these
 * with the real page component. They exist only so the router and typecheck
 * resolve before those files land. Each placeholder names the module path the
 * route should import once the page task ships.
 */

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <p className="label-ember">Coming together</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">{note}</p>
    </section>
  );
}

export function HomePagePlaceholder(): ReactNode {
  return (
    <Placeholder
      title="Stories worth your time"
      note="The editorial home page is being assembled."
    />
  );
}

export function PostDetailPagePlaceholder(): ReactNode {
  return (
    <Placeholder title="Post" note="The post detail view is being assembled." />
  );
}

export function PostEditorPagePlaceholder(): ReactNode {
  return (
    <Placeholder
      title="Write a post"
      note="The rich-text editor is being assembled."
    />
  );
}

export function DashboardPagePlaceholder(): ReactNode {
  return (
    <Placeholder
      title="Dashboard"
      note="Your posts and drafts are being assembled."
    />
  );
}

export function ProfilePagePlaceholder(): ReactNode {
  return (
    <Placeholder
      title="Profile"
      note="Your author profile is being assembled."
    />
  );
}

export function SignInPagePlaceholder(): ReactNode {
  return (
    <Placeholder
      title="Sign in"
      note="The sign-in and profile setup flow is being assembled."
    />
  );
}
