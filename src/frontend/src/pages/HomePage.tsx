import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsSignedIn } from "@/hooks/usePrincipal";
import { usePosts } from "@/hooks/useQueries";
import { formatPostDate, wasEdited } from "@/lib/format";
import { htmlToExcerpt } from "@/lib/rich-text";
import type { Post } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Feather, PenLine } from "lucide-react";

/** Ember underline signature beneath section labels and the hero subhead. */
function EmberUnderline() {
  return (
    <span
      aria-hidden="true"
      className="mt-3 block h-[3px] w-16 rounded-full bg-primary"
    />
  );
}

function PostCard({ post, index }: { post: Post; index: number }) {
  const excerpt = htmlToExcerpt(post.content, 160);
  const edited = wasEdited(post);

  return (
    <Card
      data-ocid={`post.card.${index + 1}`}
      className="group gap-0 rounded-lg border-border py-0 shadow-subtle transition-smooth hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <Link
        to="/post/$id"
        params={{ id: post.id.toString() }}
        data-ocid={`post.link.${index + 1}`}
        className="flex h-full flex-col rounded-lg p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <h3 className="font-display text-xl font-bold leading-snug tracking-tight text-foreground transition-smooth group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {excerpt || "No preview available for this post yet."}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-6 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{post.authorName}</span>
          <span aria-hidden="true">·</span>
          <time
            dateTime={new Date(
              Number(post.createdAt / 1_000_000n),
            ).toISOString()}
            className="font-mono"
          >
            {formatPostDate(post.createdAt)}
          </time>
          {edited && (
            <>
              <span aria-hidden="true">·</span>
              <span className="italic">Edited</span>
            </>
          )}
        </div>
      </Link>
    </Card>
  );
}

function PostCardSkeleton() {
  return (
    <Card className="gap-0 rounded-lg border-border py-0 shadow-subtle">
      <div className="flex flex-col p-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-6 h-3 w-1/2" />
      </div>
    </Card>
  );
}

function PostsGrid() {
  const { data: posts, isPending, isError, refetch } = usePosts();

  if (isPending) {
    return (
      <div
        data-ocid="posts.loading_state"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }, (_, i) => `post-skeleton-${i}`).map((id) => (
          <PostCardSkeleton key={id} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="posts.error_state"
        className="flex flex-col items-center rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
      >
        <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
        <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
          We couldn&apos;t load the stories
        </h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Something interrupted the feed. Check your connection and try again.
        </p>
        <Button
          type="button"
          data-ocid="posts.retry_button"
          onClick={() => void refetch()}
          className="mt-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-subtle"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div
        data-ocid="posts.empty_state"
        className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-20 text-center shadow-subtle"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Feather className="size-6" aria-hidden="true" />
        </span>
        <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">
          The first page is still blank
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          No stories have been published yet. Be the one to start the collection
          — your words belong here.
        </p>
        <Button
          asChild
          data-ocid="posts.empty_cta_button"
          className="mt-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-subtle"
        >
          <Link to="/new">
            <PenLine className="size-4" aria-hidden="true" />
            Write the first post
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      data-ocid="posts.list"
      className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
    >
      {posts.map((post, index) => (
        <PostCard key={post.id.toString()} post={post} index={index} />
      ))}
    </div>
  );
}

export function HomePage() {
  const isSignedIn = useIsSignedIn();

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="paper-texture border-b border-border bg-gradient-subtle">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="max-w-3xl motion-safe:animate-fade-up">
            <p className="label-ember">Ink &amp; Ember</p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Stories worth your time, written by hand.
            </h1>
            <div className="mt-6 max-w-2xl">
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                A quiet corner of the web for long-form writing — essays, field
                notes and ideas that deserve more than a scroll. Read slowly, or
                add your own voice to the collection.
              </p>
              <EmberUnderline />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                data-ocid="hero.primary_button"
                className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-subtle"
              >
                <Link to={isSignedIn ? "/new" : "/signin"}>
                  <PenLine className="size-4" aria-hidden="true" />
                  {isSignedIn ? "Start writing" : "Sign in to write"}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                data-ocid="hero.secondary_button"
                className="rounded-md border-border bg-transparent text-foreground hover:bg-secondary hover:shadow-subtle"
              >
                <a href="#latest">
                  Browse the latest
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Latest posts */}
      <section
        id="latest"
        data-ocid="posts.section"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-ember">The latest</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Fresh from the desk
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Every piece is published by a member of the community.
          </p>
        </div>

        <div className="mt-10">
          <PostsGrid />
        </div>
      </section>
    </div>
  );
}

export default HomePage;
