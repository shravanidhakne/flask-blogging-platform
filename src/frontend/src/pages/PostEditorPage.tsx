import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePrincipal } from "@/hooks/usePrincipal";
import { useCreatePost, usePost, useUpdatePost } from "@/hooks/useQueries";
import { isHtmlEmpty } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

/**
 * Create and edit page for a blog post.
 *
 * The same component serves `/new` (create) and `/post/$id/edit` (edit). In
 * edit mode it loads the existing post, pre-fills the fields and saves with the
 * update call; only the post's author may open it. In create mode it saves with
 * the create call. After a successful save it navigates to the post detail page.
 */

const EDITOR_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const EDITOR_FORMATS = ["header", "bold", "italic", "list", "bullet", "link"];

function parsePostId(raw: string | undefined): bigint | undefined {
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  try {
    return BigInt(raw);
  } catch {
    return undefined;
  }
}

function EditorShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="motion-safe:animate-fade-up">
        <p className="label-ember">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{description}</p>
      </div>
      <div className="mt-8 motion-safe:animate-fade-up">{children}</div>
    </section>
  );
}

function StatusPanel({
  tone,
  title,
  message,
  action,
}: {
  tone: "not-found" | "not-allowed";
  title: string;
  message: string;
  action: React.ReactNode;
}) {
  return (
    <section
      data-ocid={
        tone === "not-found" ? "editor.not_found" : "editor.not_allowed"
      }
      className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="motion-safe:animate-fade-up rounded-lg border border-border bg-card p-8 text-center shadow-subtle">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <AlertCircle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">{message}</p>
        <div className="mt-6 flex justify-center">{action}</div>
      </div>
    </section>
  );
}

export function PostEditorPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const postId = parsePostId(params.id);
  const isEdit = postId !== undefined;

  const navigate = useNavigate();
  const principal = usePrincipal();

  const postQuery = usePost(postId);
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const initializedRef = useRef(false);

  const post = postQuery.data ?? null;

  // One-time initialization of the draft from the loaded post. Never re-run on
  // refetch, so a draft the user is editing is never overwritten.
  useEffect(() => {
    if (!isEdit || initializedRef.current || !post) return;
    initializedRef.current = true;
    setTitle(post.title);
    setContent(post.content);
  }, [isEdit, post]);

  const isAuthor = useMemo(() => {
    if (!isEdit || !post || !principal) return false;
    // `post.author` is normalized to principal text by the hook, matching the
    // text returned by `usePrincipal()`.
    return post.author === principal;
  }, [isEdit, post, principal]);

  const mutation = isEdit ? updatePost : createPost;
  const isPending = mutation.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);

    const trimmedTitle = title.trim();
    const nextTitleError = trimmedTitle ? null : "Give your post a title.";
    const nextContentError = isHtmlEmpty(content)
      ? "Write something before publishing."
      : null;

    setTitleError(nextTitleError);
    setContentError(nextContentError);
    if (nextTitleError || nextContentError) return;

    const payload = { title: trimmedTitle, content };

    if (isEdit && postId !== undefined) {
      updatePost.mutate(
        { id: postId, ...payload },
        {
          onSuccess: (savedPost) => {
            setSaved(true);
            void navigate({
              to: "/post/$id",
              params: { id: savedPost.id.toString() },
            });
          },
        },
      );
      return;
    }

    createPost.mutate(payload, {
      onSuccess: (savedPost) => {
        setSaved(true);
        void navigate({
          to: "/post/$id",
          params: { id: savedPost.id.toString() },
        });
      },
    });
  }

  function handleCancel() {
    if (isEdit && postId !== undefined) {
      void navigate({ to: "/post/$id", params: { id: postId.toString() } });
      return;
    }
    void navigate({ to: "/" });
  }

  if (isEdit && postQuery.isPending) {
    return (
      <EditorShell
        eyebrow="Editing"
        title="Loading your post"
        description="Fetching the latest version so you can keep writing."
      >
        <div
          data-ocid="editor.loading_state"
          className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-subtle"
        >
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-48 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </EditorShell>
    );
  }

  if (isEdit && !postQuery.isPending && !post) {
    return (
      <StatusPanel
        tone="not-found"
        title="Post not found"
        message="This post may have been deleted, or the link is no longer valid."
        action={
          <Button asChild type="button" className="rounded-md">
            <Link to="/" data-ocid="editor.back_button">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to stories
            </Link>
          </Button>
        }
      />
    );
  }

  if (isEdit && post && !isAuthor) {
    return (
      <StatusPanel
        tone="not-allowed"
        title="You can't edit this post"
        message="Only the author can edit this story. You can still read it on its page."
        action={
          <Button asChild type="button" className="rounded-md">
            <Link
              to="/post/$id"
              params={{ id: post.id.toString() }}
              data-ocid="editor.read_button"
            >
              Read the post
            </Link>
          </Button>
        }
      />
    );
  }

  const errorMessage = mutation.isError
    ? mutation.error instanceof Error
      ? mutation.error.message
      : "Something went wrong while saving. Please try again."
    : null;

  return (
    <EditorShell
      eyebrow={isEdit ? "Editing" : "New story"}
      title={isEdit ? "Refine your story" : "Write a new story"}
      description={
        isEdit
          ? "Update the title or body, then save your changes."
          : "Give it a title, shape the body, and publish when it feels right."
      }
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-subtle md:p-8"
      >
        <div className="space-y-2">
          <Label htmlFor="post-title">Title</Label>
          <Input
            id="post-title"
            data-ocid="editor.title_input"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder="A headline worth clicking"
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? "post-title-error" : undefined}
            className="h-11 text-base"
            autoComplete="off"
          />
          {titleError && (
            <p
              id="post-title-error"
              data-ocid="editor.title_error"
              className="flex items-center gap-1.5 text-sm text-destructive"
            >
              <AlertCircle className="size-4" aria-hidden="true" />
              {titleError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="post-content">Content</Label>
          <div
            data-ocid="editor.editor"
            className={cn(
              "overflow-hidden rounded-md border bg-background [&_.ql-editor]:min-h-[16rem] [&_.ql-editor]:text-base [&_.ql-editor]:leading-relaxed [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-border [&_.ql-toolbar]:bg-muted/40 [&_.ql-container]:border-0 [&_.ql-container]:font-body",
              contentError ? "border-destructive" : "border-input",
            )}
          >
            <ReactQuill
              id="post-content"
              theme="snow"
              value={content}
              onChange={(value) => {
                setContent(value);
                if (contentError) setContentError(null);
              }}
              modules={EDITOR_MODULES}
              formats={EDITOR_FORMATS}
              placeholder="Start writing…"
            />
          </div>
          {contentError && (
            <p
              data-ocid="editor.content_error"
              className="flex items-center gap-1.5 text-sm text-destructive"
            >
              <AlertCircle className="size-4" aria-hidden="true" />
              {contentError}
            </p>
          )}
        </div>

        {errorMessage && (
          <p
            data-ocid="editor.error_state"
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {errorMessage}
          </p>
        )}

        {saved && (
          <output
            data-ocid="editor.success_state"
            className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent"
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            Saved. Taking you to your post…
          </output>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            data-ocid="editor.cancel_button"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-md"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            data-ocid="editor.submit_button"
            disabled={isPending}
            className="rounded-md"
          >
            {isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {isEdit ? "Save changes" : "Publish post"}
          </Button>
        </div>
      </form>
    </EditorShell>
  );
}
