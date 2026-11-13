import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { usePrincipal } from "@/hooks/usePrincipal";
import {
  useCreateProfile,
  useMyProfile,
  usePostsByAuthor,
  useProfile,
  useUpdateProfile,
} from "@/hooks/useQueries";
import { formatPostDate, wasEdited } from "@/lib/format";
import { htmlToExcerpt } from "@/lib/rich-text";
import type { Post, Profile, ProfileInput } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Feather,
  PenLine,
  Pencil,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

interface FormErrors {
  displayName?: string;
  username?: string;
  bio?: string;
}

/** Validate the profile form fields; returns an empty object when valid. */
function validateProfile(input: ProfileInput): FormErrors {
  const errors: FormErrors = {};
  const displayName = input.displayName.trim();
  const username = input.username.trim();

  if (!displayName) {
    errors.displayName = "A display name is required.";
  } else if (displayName.length > 60) {
    errors.displayName = "Keep the display name under 60 characters.";
  }

  if (!username) {
    errors.username = "A username is required.";
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username = "Use 3–24 lowercase letters, numbers or underscores.";
  }

  if (input.bio.length > 280) {
    errors.bio = "Keep the bio under 280 characters.";
  }

  return errors;
}

interface ProfileFormProps {
  mode: "create" | "edit";
  initial: ProfileInput;
  /** The signed-in principal, so the uniqueness check ignores the user's own handle. */
  principal: string | undefined;
  onCancel?: () => void;
  onSaved: (profile: Profile) => void;
}

function ProfileForm({
  mode,
  initial,
  principal,
  onCancel,
  onSaved,
}: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [errors, setErrors] = useState<FormErrors>({});
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; message: string } | undefined
  >(undefined);

  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const mutation = mode === "create" ? createProfile : updateProfile;

  // Live uniqueness probe for the typed username. The query is disabled until
  // the handle is well-formed, so we never fire a lookup per keystroke.
  const trimmedUsername = username.trim();
  const usernameWellFormed = USERNAME_PATTERN.test(trimmedUsername);
  const usernameTaken = useProfile(
    usernameWellFormed ? trimmedUsername : undefined,
  );
  const takenByOther =
    usernameWellFormed &&
    usernameTaken.data != null &&
    usernameTaken.data.id !== principal;

  // Surface the uniqueness result as an inline error once the probe settles.
  useEffect(() => {
    if (!usernameWellFormed || usernameTaken.isPending) return;
    setErrors((current) => {
      if (takenByOther) {
        return { ...current, username: "That username is already taken." };
      }
      if (current.username === "That username is already taken.") {
        const { username: _removed, ...rest } = current;
        return rest;
      }
      return current;
    });
  }, [takenByOther, usernameWellFormed, usernameTaken.isPending]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(undefined);

    const input: ProfileInput = {
      displayName: displayName.trim(),
      username: trimmedUsername,
      bio: bio.trim(),
    };

    const nextErrors = validateProfile(input);
    if (takenByOther) {
      nextErrors.username = "That username is already taken.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    mutation.mutate(input, {
      onSuccess: (profile) => {
        setFeedback({
          kind: "success",
          message:
            mode === "create"
              ? "Your profile is live. Welcome to Ink & Ember."
              : "Profile updated.",
        });
        onSaved(profile);
      },
      onError: (error) => {
        setFeedback({
          kind: "error",
          message:
            error instanceof Error && error.message
              ? error.message
              : "We couldn't save your profile. Please try again.",
        });
      },
    });
  };

  return (
    <form
      data-ocid="profile.form"
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="profile-display-name"
          className="block text-sm font-medium text-foreground"
        >
          Display name
        </label>
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
          className="border-input bg-card"
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
        <label
          htmlFor="profile-username"
          className="block text-sm font-medium text-foreground"
        >
          Username
        </label>
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="font-mono text-sm text-muted-foreground"
          >
            @
          </span>
          <Input
            id="profile-username"
            data-ocid="profile.username_input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="ada_writes"
            autoComplete="username"
            spellCheck={false}
            aria-invalid={errors.username ? true : undefined}
            aria-describedby={
              errors.username ? "profile-username-error" : undefined
            }
            className="border-input bg-card"
          />
        </div>
        {errors.username ? (
          <p
            id="profile-username-error"
            data-ocid="profile.username_error"
            className="text-sm text-destructive"
          >
            {errors.username}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers and underscores. This is how readers find
            you.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="profile-bio"
          className="block text-sm font-medium text-foreground"
        >
          Bio
        </label>
        <Textarea
          id="profile-bio"
          data-ocid="profile.bio_textarea"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="A sentence or two about what you write."
          rows={4}
          aria-invalid={errors.bio ? true : undefined}
          aria-describedby={errors.bio ? "profile-bio-error" : undefined}
          className="border-input bg-card"
        />
        <div className="flex items-center justify-between gap-2">
          {errors.bio ? (
            <p
              id="profile-bio-error"
              data-ocid="profile.bio_error"
              className="text-sm text-destructive"
            >
              {errors.bio}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">
              Optional — up to 280 characters.
            </span>
          )}
          <span className="font-mono text-xs text-muted-foreground">
            {bio.length}/280
          </span>
        </div>
      </div>

      {feedback && (
        <output
          data-ocid={
            feedback.kind === "success"
              ? "profile.success_state"
              : "profile.error_state"
          }
          className={
            feedback.kind === "success"
              ? "flex items-start gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-foreground"
              : "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground"
          }
        >
          {feedback.kind === "success" ? (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
          )}
          <span>{feedback.message}</span>
        </output>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          data-ocid="profile.submit_button"
          disabled={mutation.isPending}
          className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-subtle"
        >
          {mutation.isPending
            ? "Saving…"
            : mode === "create"
              ? "Create profile"
              : "Save changes"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            data-ocid="profile.cancel_button"
            onClick={onCancel}
            disabled={mutation.isPending}
            className="rounded-md border-border bg-transparent text-foreground hover:bg-secondary"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function ProfileHeader({ profile }: { profile: Profile }) {
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary"
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <h1
          data-ocid="profile.display_name"
          className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl"
        >
          {profile.displayName}
        </h1>
        <p
          data-ocid="profile.username"
          className="mt-1 font-mono text-sm text-primary"
        >
          @{profile.username}
        </p>
        {profile.bio ? (
          <p
            data-ocid="profile.bio"
            className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground"
          >
            {profile.bio}
          </p>
        ) : (
          <p className="mt-4 max-w-2xl text-base italic leading-relaxed text-muted-foreground">
            No bio yet — add a line about what you write.
          </p>
        )}
      </div>
    </div>
  );
}

function PublishedPosts({ author }: { author: string | undefined }) {
  const { data: posts, isPending, isError, refetch } = usePostsByAuthor(author);

  if (isPending) {
    return (
      <div
        data-ocid="profile.posts.loading_state"
        className="space-y-3"
        aria-hidden="true"
      >
        {Array.from({ length: 3 }, (_, i) => `profile-post-skeleton-${i}`).map(
          (id) => (
            <div
              key={id}
              className="rounded-lg border border-border bg-card p-5 shadow-subtle"
            >
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-3 h-3 w-1/3" />
            </div>
          ),
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="profile.posts.error_state"
        className="flex flex-col items-center rounded-lg border border-border bg-card px-6 py-12 text-center shadow-subtle"
      >
        <AlertCircle className="size-7 text-destructive" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn&apos;t load your published posts.
        </p>
        <Button
          type="button"
          data-ocid="profile.posts.retry_button"
          onClick={() => void refetch()}
          className="mt-5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div
        data-ocid="profile.posts.empty_state"
        className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center shadow-subtle"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Feather className="size-5" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
          No published posts yet
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Your byline is waiting. Write your first piece and it will appear
          here.
        </p>
        <Button
          asChild
          data-ocid="profile.posts.write_button"
          className="mt-5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-subtle"
        >
          <Link to="/new">
            <PenLine className="size-4" aria-hidden="true" />
            Write a post
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ul data-ocid="profile.posts.list" className="space-y-3">
      {posts.map((post: Post, index: number) => (
        <li key={post.id.toString()}>
          <Link
            to="/post/$id"
            params={{ id: post.id.toString() }}
            data-ocid={`profile.posts.item.${index + 1}`}
            className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-5 shadow-subtle transition-smooth hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-bold tracking-tight text-foreground transition-smooth group-hover:text-primary">
                {post.title}
              </span>
              <span className="mt-1 block truncate text-sm text-muted-foreground">
                {htmlToExcerpt(post.content, 90) || "No preview available."}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <time
                dateTime={new Date(
                  Number(post.createdAt / 1_000_000n),
                ).toISOString()}
                className="font-mono"
              >
                {formatPostDate(post.createdAt)}
              </time>
              {wasEdited(post) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="italic">Edited</span>
                </>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ProfilePage() {
  const principal = usePrincipal();
  const { data: profile, isPending, isError, refetch } = useMyProfile();
  const [editing, setEditing] = useState(false);

  const initial: ProfileInput = useMemo(
    () => ({
      displayName: profile?.displayName ?? "",
      username: profile?.username ?? "",
      bio: profile?.bio ?? "",
    }),
    [profile],
  );

  const hasProfile = profile != null;

  return (
    <div className="bg-background">
      <section className="paper-texture border-b border-border bg-gradient-subtle">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <p className="label-ember">Your profile</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {hasProfile ? "Your author page" : "Set up your author profile"}
          </h1>
          <EmberUnderline />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        {isPending ? (
          <Card
            data-ocid="profile.loading_state"
            className="gap-0 rounded-lg border-border p-6 shadow-subtle md:p-8"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Skeleton className="size-16 shrink-0 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </Card>
        ) : isError ? (
          <Card
            data-ocid="profile.error_state"
            className="items-center gap-0 rounded-lg border-border px-6 py-14 text-center shadow-subtle"
          >
            <AlertCircle
              className="size-8 text-destructive"
              aria-hidden="true"
            />
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
          </Card>
        ) : !hasProfile ? (
          <Card
            data-ocid="profile.create_prompt"
            className="gap-0 rounded-lg border-border p-6 shadow-subtle md:p-8"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Create your profile
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Add a display name, a username and a short bio so readers know
                  who is behind the words.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <ProfileForm
                mode="create"
                initial={initial}
                principal={principal}
                onSaved={() => undefined}
              />
            </div>
          </Card>
        ) : (
          <Card
            data-ocid="profile.card"
            className="gap-0 rounded-lg border-border p-6 shadow-subtle md:p-8"
          >
            {editing ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    Edit your profile
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-ocid="profile.close_button"
                    aria-label="Close edit form"
                    onClick={() => setEditing(false)}
                    className="rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <div className="mt-6">
                  <ProfileForm
                    mode="edit"
                    initial={initial}
                    principal={principal}
                    onCancel={() => setEditing(false)}
                    onSaved={() => setEditing(false)}
                  />
                </div>
              </>
            ) : (
              <>
                <ProfileHeader profile={profile} />
                <div className="mt-6">
                  <Button
                    type="button"
                    data-ocid="profile.edit_button"
                    onClick={() => setEditing(true)}
                    className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-subtle"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit profile
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {hasProfile && (
          <div className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label-ember">Published</p>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight md:text-3xl">
                  Your posts
                </h2>
              </div>
              <Button
                asChild
                variant="outline"
                data-ocid="profile.posts.write_button"
                className="rounded-md border-border bg-transparent text-foreground hover:bg-secondary hover:shadow-subtle"
              >
                <Link to="/new">
                  <PenLine className="size-4" aria-hidden="true" />
                  Write a post
                </Link>
              </Button>
            </div>
            <div className="mt-6">
              <PublishedPosts author={principal} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default ProfilePage;
