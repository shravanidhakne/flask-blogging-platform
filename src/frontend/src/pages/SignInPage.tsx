import { SignInButton } from "@/components/InternetIdentity";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useIsSignedIn } from "@/hooks/usePrincipal";
import { useCreateProfile, useMyProfile } from "@/hooks/useQueries";
import type { Profile } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Feather,
  LayoutDashboard,
  PenLine,
  UserRound,
} from "lucide-react";
import { type FormEvent, useState } from "react";

/** Ember underline signature beneath section labels. */
function EmberUnderline() {
  return (
    <span
      aria-hidden="true"
      className="mt-3 block h-[3px] w-16 rounded-full bg-primary"
    />
  );
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

interface FieldErrors {
  displayName?: string;
  username?: string;
}

/** Validate the profile draft and return per-field messages. */
function validateProfile(displayName: string, username: string): FieldErrors {
  const errors: FieldErrors = {};
  if (displayName.trim().length === 0) {
    errors.displayName = "Please add a display name.";
  } else if (displayName.trim().length > 60) {
    errors.displayName = "Keep your display name under 60 characters.";
  }
  const handle = username.trim();
  if (handle.length === 0) {
    errors.username = "Please choose a username.";
  } else if (!USERNAME_PATTERN.test(handle)) {
    errors.username = "Use 3–24 lowercase letters, numbers or underscores.";
  }
  return errors;
}

/** Signed-out welcome panel with the Internet Identity entry point. */
function WelcomePanel() {
  return (
    <section
      data-ocid="signin.welcome_panel"
      className="paper-texture border-b border-border bg-gradient-subtle"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div className="motion-safe:animate-fade-up">
          <p className="label-ember">Join Ink &amp; Ember</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl">
            Anyone can join and publish.
          </h1>
          <div className="mt-6 max-w-xl">
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              There is no application and no waiting list. Sign in once, set up
              your author profile, and your words go live the moment you publish
              them.
            </p>
            <EmberUnderline />
          </div>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>
                A profile with your display name, username and a short bio.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>
                A dashboard to write, edit and manage everything you publish.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>
                Sign-in secured by Internet Identity — no passwords to remember.
              </span>
            </li>
          </ul>
        </div>

        <Card
          data-ocid="signin.auth_card"
          className="gap-0 rounded-lg border-border bg-card p-8 shadow-subtle"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Feather className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
            Sign in to start writing
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Use Internet Identity to create your account or return to an
            existing one. It takes a moment and keeps your identity private.
          </p>
          <div className="mt-6">
            <SignInButton className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary/90 hover:shadow-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60" />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            The blog is open to everyone — no approval required.
          </p>
        </Card>
      </div>
    </section>
  );
}

/** Profile setup form shown to a signed-in user without a profile yet. */
function ProfileSetupForm() {
  const createProfile = useCreateProfile();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateProfile(displayName, username);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    createProfile.mutate(
      {
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
      },
      {
        onSuccess: () => setSubmitted(true),
      },
    );
  }

  if (submitted) {
    return (
      <div
        data-ocid="profile.success_state"
        className="flex flex-col items-center rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
          Your profile is ready
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Welcome to Ink &amp; Ember, {displayName.trim()}. Your author page is
          live and you can publish your first story whenever you are ready.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            data-ocid="profile.write_button"
            className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-subtle"
          >
            <Link to="/new">
              <PenLine className="size-4" aria-hidden="true" />
              Write a post
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            data-ocid="profile.view_button"
            className="rounded-md border-border bg-transparent text-foreground hover:bg-secondary hover:shadow-subtle"
          >
            <Link to="/profile">
              View my profile
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card
      data-ocid="profile.setup_card"
      className="gap-0 rounded-lg border-border bg-card p-8 shadow-subtle"
    >
      <p className="label-ember">One last step</p>
      <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
        Set up your author profile
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        This is how readers will find you across the blog. You can change any of
        it later.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="profile-display-name">Display name</Label>
          <Input
            id="profile-display-name"
            data-ocid="profile.display_name_input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Ada Lovelace"
            autoComplete="name"
            aria-invalid={errors.displayName ? true : undefined}
            aria-describedby={
              errors.displayName ? "profile-display-name-error" : undefined
            }
            className="h-11 rounded-md border-input bg-background"
          />
          {errors.displayName && (
            <p
              id="profile-display-name-error"
              data-ocid="profile.display_name_error"
              className="text-sm text-destructive"
            >
              {errors.displayName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-username">Username</Label>
          <Input
            id="profile-username"
            data-ocid="profile.username_input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="ada_writes"
            autoComplete="username"
            aria-invalid={errors.username ? true : undefined}
            aria-describedby={
              errors.username
                ? "profile-username-error"
                : "profile-username-hint"
            }
            className="h-11 rounded-md border-input bg-background"
          />
          {errors.username ? (
            <p
              id="profile-username-error"
              data-ocid="profile.username_error"
              className="text-sm text-destructive"
            >
              {errors.username}
            </p>
          ) : (
            <p
              id="profile-username-hint"
              className="text-xs text-muted-foreground"
            >
              3–24 lowercase letters, numbers or underscores. This must be
              unique.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-bio">Bio</Label>
          <Textarea
            id="profile-bio"
            data-ocid="profile.bio_textarea"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="A sentence or two about what you write."
            rows={4}
            className="rounded-md border-input bg-background"
          />
          <p className="text-xs text-muted-foreground">
            Optional — a short introduction shown on your author page.
          </p>
        </div>

        {createProfile.isError && (
          <p
            role="alert"
            data-ocid="profile.error_state"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>
              We couldn&apos;t save your profile. That username may already be
              taken — try another and submit again.
            </span>
          </p>
        )}

        <Button
          type="submit"
          data-ocid="profile.submit_button"
          disabled={createProfile.isPending}
          className="h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-subtle"
        >
          {createProfile.isPending
            ? "Creating your profile…"
            : "Create profile"}
        </Button>
      </form>
    </Card>
  );
}

/** Confirmation shown to a signed-in user who already has a profile. */
function SignedInPanel({ profile }: { profile: Profile }) {
  return (
    <Card
      data-ocid="signin.signed_in_card"
      className="gap-0 rounded-lg border-border bg-card p-8 shadow-subtle"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UserRound className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-5 label-ember">Signed in</p>
      <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
        Welcome back, {profile.displayName}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        You are signed in as{" "}
        <span className="font-mono text-foreground">@{profile.username}</span>.
        Head to your dashboard to manage your stories, or visit your author page
        to see how readers see you.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          asChild
          data-ocid="signin.dashboard_button"
          className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-subtle"
        >
          <Link to="/dashboard">
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Go to dashboard
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          data-ocid="signin.profile_button"
          className="rounded-md border-border bg-transparent text-foreground hover:bg-secondary hover:shadow-subtle"
        >
          <Link to="/profile">
            View my profile
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function ProfilePanelSkeleton() {
  return (
    <Card
      data-ocid="profile.loading_state"
      className="gap-0 rounded-lg border-border bg-card p-8 shadow-subtle"
    >
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-6 h-11 w-full" />
    </Card>
  );
}

/** Signed-in branch: profile setup form, confirmation, or loading. */
function SignedInView() {
  const { data: profile, isPending, isError, refetch } = useMyProfile();

  if (isPending) {
    return <ProfilePanelSkeleton />;
  }

  if (isError) {
    return (
      <div
        data-ocid="profile.load_error_state"
        className="flex flex-col items-center rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
      >
        <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
        <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
          We couldn&apos;t load your profile
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Something interrupted the request. Check your connection and try
          again.
        </p>
        <Button
          type="button"
          data-ocid="profile.retry_button"
          onClick={() => void refetch()}
          className="mt-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-subtle"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (profile) {
    return <SignedInPanel profile={profile} />;
  }

  return <ProfileSetupForm />;
}

export function SignInPage() {
  const isSignedIn = useIsSignedIn();

  return (
    <div className="bg-background">
      {isSignedIn ? (
        <section
          data-ocid="signin.page"
          className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
        >
          <div className="motion-safe:animate-fade-up">
            <p className="label-ember">Your account</p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Your Ink &amp; Ember account
            </h1>
            <div className="mt-8">
              <SignedInView />
            </div>
          </div>
        </section>
      ) : (
        <WelcomePanel />
      )}
    </div>
  );
}

export default SignInPage;
