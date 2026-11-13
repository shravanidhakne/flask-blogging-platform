import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrincipal } from "@/hooks/usePrincipal";
import { useDeletePost, usePost } from "@/hooks/useQueries";
import { formatFullDate, formatRelativeDate, wasEdited } from "@/lib/format";
import { sanitizeHtml } from "@/lib/rich-text";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  PenLine,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";

/** Parse the route's `$id` param into a post id, or `undefined` when invalid. */
function parsePostId(raw: string | undefined): bigint | undefined {
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  try {
    return BigInt(raw);
  } catch {
    return undefined;
  }
}

function PostDetailSkeleton() {
  return (
    <article
      data-ocid="post.loading_state"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
    >
      <span className="sr-only">Loading post</span>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-6 h-12 w-full max-w-2xl" />
      <Skeleton className="mt-3 h-12 w-3/4 max-w-xl" />
      <div className="mt-8 flex items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="mt-10 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </article>
  );
}

function PostNotFound() {
  return (
    <section
      data-ocid="post.empty_state"
      className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8"
    >
      <p className="label-ember">Nothing here</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
        This story has gone missing
      </h1>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        The post you are looking for may have been deleted, or the link is no
        longer valid.
      </p>
      <Button asChild className="mt-8 rounded-md">
        <Link to="/" data-ocid="post.back_link">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to all stories
        </Link>
      </Button>
    </section>
  );
}

function PostError({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      data-ocid="post.error_state"
      role="alert"
      className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8"
    >
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">
        We couldn&apos;t load this story
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Something went wrong while fetching the post. Please try again.
      </p>
      <Button
        type="button"
        onClick={onRetry}
        data-ocid="post.retry_button"
        className="mt-8 rounded-md"
      >
        Try again
      </Button>
    </section>
  );
}

export function PostDetailPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const principal = usePrincipal();

  const postId = useMemo(() => parsePostId(params.id), [params.id]);
  const postQuery = usePost(postId);
  const deletePost = useDeletePost();

  const post = postQuery.data ?? null;
  // `post.author` is normalized to principal text by the hook, and `principal`
  // is already principal text, so both sides compare in the same representation.
  const isAuthor = !!post && !!principal && post.author === principal;

  const sanitizedContent = useMemo(
    () => (post ? sanitizeHtml(post.content) : ""),
    [post],
  );

  if (postId === undefined) {
    return <PostNotFound />;
  }

  // `isPending` (not `isLoading`) covers the disabled first render before the
  // actor is ready, so the page shows a loading state instead of a false
  // not-found flash.
  if (postQuery.isPending) {
    return <PostDetailSkeleton />;
  }

  if (postQuery.isError) {
    return <PostError onRetry={() => void postQuery.refetch()} />;
  }

  if (!post) {
    return <PostNotFound />;
  }

  const edited = wasEdited(post);
  const authorInitial = post.authorName.trim().charAt(0).toUpperCase() || "?";

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        void navigate({ to: "/" });
      },
    });
  };

  return (
    <article
      data-ocid="post.page"
      className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-20 lg:px-8"
    >
      <Link
        to="/"
        data-ocid="post.back_link"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All stories
      </Link>

      <header className="mt-8">
        <p className="label-ember">Story</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          {post.title}
        </h1>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary"
            >
              {authorInitial}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {post.authorName}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                @{post.authorUsername}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              <time
                dateTime={new Date(
                  Number(post.createdAt / 1_000_000n),
                ).toISOString()}
              >
                {formatFullDate(post.createdAt)}
              </time>
            </span>
            {edited && (
              <span
                data-ocid="post.edited_badge"
                className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                title={`Edited ${formatRelativeDate(post.updatedAt)}`}
              >
                Edited
              </span>
            )}
          </div>
        </div>

        {isAuthor && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="rounded-md">
              <Link
                to="/post/$id/edit"
                params={{ id: post.id.toString() }}
                data-ocid="post.edit_button"
              >
                <PenLine className="size-4" aria-hidden="true" />
                Edit post
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  data-ocid="post.delete_button"
                  className="rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="post.delete_modal">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{post.title}&rdquo; will be permanently removed. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    data-ocid="post.cancel_button"
                    className="rounded-md"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="post.confirm_button"
                    disabled={deletePost.isPending}
                    onClick={(event) => {
                      event.preventDefault();
                      handleDelete();
                    }}
                    className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletePost.isPending ? "Deleting…" : "Delete post"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {deletePost.isError && (
              <p
                data-ocid="post.error_state"
                role="alert"
                className="text-sm text-destructive"
              >
                Could not delete the post. Please try again.
              </p>
            )}
          </div>
        )}
      </header>

      <div
        data-ocid="post.content"
        className="prose prose-lg mt-10 max-w-none font-body text-foreground prose-headings:font-display prose-headings:tracking-tight prose-headings:text-foreground prose-p:leading-relaxed prose-p:text-foreground prose-a:font-medium prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:font-display prose-blockquote:not-italic prose-blockquote:text-muted-foreground prose-code:font-mono prose-code:text-primary prose-li:text-foreground prose-li:marker:text-primary"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: content is sanitized above
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </article>
  );
}
