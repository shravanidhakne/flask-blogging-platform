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
import {
  useDeletePost,
  useMyProfile,
  usePostsByAuthor,
} from "@/hooks/useQueries";
import { formatFullDate, formatRelativeDate, wasEdited } from "@/lib/format";
import { htmlToExcerpt } from "@/lib/rich-text";
import type { Post } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  PenLine,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

/** Most recent post by creation time, or `null` for an empty list. */
function mostRecentPost(posts: Post[]): Post | null {
  if (posts.length === 0) return null;
  return posts.reduce((latest, post) =>
    post.createdAt > latest.createdAt ? post : latest,
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-subtle">
      <p className="label-ember">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function DashboardSkeleton() {
  const rows = Array.from({ length: 3 }, (_, i) => `dashboard-skeleton-${i}`);
  return (
    <div className="space-y-4" data-ocid="dashboard.loading_state">
      {rows.map((id) => (
        <div
          key={id}
          className="rounded-lg border border-border bg-card p-5 shadow-subtle"
        >
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function PostRow({
  post,
  index,
  onDelete,
  isDeleting,
}: {
  post: Post;
  index: number;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
}) {
  const excerpt = htmlToExcerpt(post.content, 140);
  const edited = wasEdited(post);

  return (
    <li
      data-ocid={`dashboard.post.item.${index}`}
      className="group rounded-lg border border-border bg-card p-5 shadow-subtle transition-smooth hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            to="/post/$id"
            params={{ id: post.id.toString() }}
            data-ocid={`dashboard.post.link.${index}`}
            className="font-display text-xl font-bold tracking-tight text-foreground transition-smooth hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {post.title}
          </Link>
          {excerpt && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {excerpt}
            </p>
          )}
          <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Created</dt>
              <CalendarDays className="size-3.5" aria-hidden="true" />
              <dd>
                Created{" "}
                <time
                  dateTime={new Date(
                    Number(post.createdAt / 1_000_000n),
                  ).toISOString()}
                >
                  {formatFullDate(post.createdAt)}
                </time>
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Updated</dt>
              <dd>
                {edited ? "Updated " : "Last saved "}
                <time
                  dateTime={new Date(
                    Number(post.updatedAt / 1_000_000n),
                  ).toISOString()}
                >
                  {formatFullDate(post.updatedAt)}
                </time>
                <span className="ml-1 text-muted-foreground/70">
                  ({formatRelativeDate(post.updatedAt)})
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            data-ocid={`dashboard.post.edit_button.${index}`}
          >
            <Link to="/post/$id/edit" params={{ id: post.id.toString() }}>
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                data-ocid={`dashboard.post.delete_button.${index}`}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 aria-hidden="true" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="dashboard.delete_dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                <AlertDialogDescription>
                  “{post.title}” will be permanently removed. This cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="dashboard.delete_cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="dashboard.delete_confirm_button"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDelete(post.id)}
                >
                  Delete post
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </li>
  );
}

export function DashboardPage() {
  const principal = usePrincipal();
  const profileQuery = useMyProfile();
  const postsQuery = usePostsByAuthor(principal);
  const deletePost = useDeletePost();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const posts = useMemo(() => {
    const list = postsQuery.data ?? [];
    return [...list].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [postsQuery.data]);

  const latest = mostRecentPost(posts);
  const displayName = profileQuery.data?.displayName?.trim();

  function handleDelete(id: bigint) {
    setDeleteError(null);
    deletePost.mutate(id, {
      onError: () => {
        setDeleteError("We couldn't delete that post. Please try again.");
      },
    });
  }

  return (
    <div className="bg-background" data-ocid="dashboard.page">
      <section className="border-b border-border bg-gradient-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="animate-fade-up">
              <p className="label-ember">Your writing desk</p>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
                {displayName
                  ? `Welcome back, ${displayName}`
                  : "Your dashboard"}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Manage everything you've published — edit a draft, tidy a title,
                or start something new.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              data-ocid="dashboard.create_button"
              className="animate-fade-up self-start rounded-md shadow-subtle"
            >
              <Link to="/new">
                <PenLine aria-hidden="true" />
                Write a new post
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <StatCard
            label="Published posts"
            value={postsQuery.isLoading ? "—" : String(posts.length)}
            hint={
              posts.length === 1
                ? "One story on your shelf"
                : "Stories on your shelf"
            }
          />
          <StatCard
            label="Most recent"
            value={latest ? formatFullDate(latest.createdAt) : "—"}
            hint={latest ? `“${latest.title}”` : "No posts yet"}
          />
        </div>

        <div className="mt-12 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Your posts
          </h2>
          {posts.length > 0 && (
            <span className="font-mono text-xs text-muted-foreground">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          )}
        </div>

        {deleteError && (
          <div
            role="alert"
            data-ocid="dashboard.delete_error_state"
            className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>{deleteError}</p>
          </div>
        )}

        <div className="mt-6">
          {postsQuery.isLoading ? (
            <DashboardSkeleton />
          ) : postsQuery.isError ? (
            <div
              data-ocid="dashboard.error_state"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-8 text-center"
            >
              <AlertTriangle
                className="mx-auto size-8 text-destructive"
                aria-hidden="true"
              />
              <h3 className="mt-4 font-display text-xl font-bold">
                We couldn't load your posts
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Something went wrong reaching the archive. Try again in a
                moment.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                data-ocid="dashboard.retry_button"
                onClick={() => void postsQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div
              data-ocid="dashboard.empty_state"
              className="rounded-lg border border-dashed border-border bg-card p-10 text-center shadow-subtle"
            >
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
                <PenLine className="size-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">
                Your first story starts here
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                You haven't published anything yet. Share an idea, a field note,
                or a long read — it only takes a title and a few words.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-6 rounded-md shadow-subtle"
                data-ocid="dashboard.empty_create_button"
              >
                <Link to="/new">
                  <PenLine aria-hidden="true" />
                  Write your first post
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4" data-ocid="dashboard.post.list">
              {posts.map((post, index) => (
                <PostRow
                  key={post.id.toString()}
                  post={post}
                  index={index + 1}
                  onDelete={handleDelete}
                  isDeleting={deletePost.isPending}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
