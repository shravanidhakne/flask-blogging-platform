import { createActor } from "@/backend";
import type { Post, PostInput, Profile, ProfileInput } from "@/lib/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Convert a principal text into the `Principal` the generated bindings take. */
function principalFromText(text: string): Principal {
  return Principal.fromText(text);
}

/**
 * The generated `Backend` actor is the source of truth for the domain calls.
 * Its methods return the generated wrapper shapes (`Result`/`Result_1`) and
 * `PostView`/`ProfileView` records whose ids are `Principal`s. The pages work
 * with the app's own `Post`/`Profile` types (string ids, no wrappers), so every
 * actor call is normalized here — the hooks are the only place that touches the
 * actor, and page components never see the binding shape.
 */

/** A generated `Result`/`Result_1`/`Result_2` wrapper. */
interface ResultWrapper<T> {
  __kind__: "ok" | "err";
  ok?: T;
  err?: unknown;
}

function isResultWrapper(value: unknown): value is ResultWrapper<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "__kind__" in value &&
    ((value as { __kind__?: unknown }).__kind__ === "ok" ||
      (value as { __kind__?: unknown }).__kind__ === "err")
  );
}

/** Turn a backend error variant into a readable message. */
function describeError(err: unknown): string {
  if (err && typeof err === "object" && "__kind__" in err) {
    const kind = (err as { __kind__: string }).__kind__;
    switch (kind) {
      case "usernameTaken":
        return "That username is already taken.";
      case "invalidUsername":
        return "That username is not valid.";
      case "invalidDisplayName":
        return "That display name is not valid.";
      case "invalidTitle":
        return "That title is not valid.";
      case "invalidContent":
        return "That content is not valid.";
      case "notFound":
        return "That post no longer exists.";
      case "notAuthor":
        return "You can only change your own posts.";
      case "notSignedIn":
        return "Please sign in to continue.";
      case "notRegistered":
        return "Create your profile before publishing.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  return "Something went wrong. Please try again.";
}

/**
 * Unwrap a generated `Result` wrapper to its `ok` value, throwing a readable
 * error for the `err` variant. Plain values (already-unwrapped results) pass
 * through unchanged.
 */
function unwrapResult<T>(value: unknown): T {
  if (isResultWrapper(value)) {
    if (value.__kind__ === "err") {
      throw new Error(describeError(value.err));
    }
    return value.ok as T;
  }
  return value as T;
}

/** Normalize a `PostView` (or an already-normalized `Post`) to the app type. */
function normalizePost(value: unknown): Post {
  const view = value as {
    id: bigint;
    author: { toText?: () => string } | string;
    authorName: string;
    authorUsername: string;
    title: string;
    content: string;
    createdAt: bigint;
    updatedAt: bigint;
  };
  const author =
    typeof view.author === "string"
      ? view.author
      : typeof view.author?.toText === "function"
        ? view.author.toText()
        : String(view.author);
  return {
    id: view.id,
    author,
    authorName: view.authorName,
    authorUsername: view.authorUsername,
    title: view.title,
    content: view.content,
    createdAt: view.createdAt,
    updatedAt: view.updatedAt,
  };
}

/** Normalize a `ProfileView` (or an already-normalized `Profile`). */
function normalizeProfile(value: unknown): Profile {
  const view = value as {
    id: { toText?: () => string } | string;
    displayName: string;
    username: string;
    bio: string;
  };
  const id =
    typeof view.id === "string"
      ? view.id
      : typeof view.id?.toText === "function"
        ? view.id.toText()
        : String(view.id);
  return {
    id,
    displayName: view.displayName,
    username: view.username,
    bio: view.bio,
  };
}

export const queryKeys = {
  posts: ["posts"] as const,
  postsByAuthor: (author: string) => ["posts", "author", author] as const,
  post: (id: bigint) => ["post", id.toString()] as const,
  myProfile: ["profile", "me"] as const,
  profile: (id: string) => ["profile", id] as const,
};

/* ------------------------------------------------------------------ posts */

export function usePosts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.posts,
    queryFn: async (): Promise<Post[]> => {
      if (!actor) return [];
      const posts = await actor.listPosts();
      return posts.map(normalizePost);
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostsByAuthor(author: string | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.postsByAuthor(author ?? ""),
    queryFn: async (): Promise<Post[]> => {
      if (!actor || !author) return [];
      const posts = await actor.listPostsByAuthor(principalFromText(author));
      return posts.map(normalizePost);
    },
    enabled: !!actor && !isFetching && !!author,
  });
}

export function usePost(id: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.post(id ?? 0n),
    queryFn: async (): Promise<Post | null> => {
      if (!actor || id === undefined) return null;
      const post = await actor.getPost(id);
      return post ? normalizePost(post) : null;
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreatePost() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PostInput): Promise<Post> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.createPost(input.title, input.content);
      return normalizePost(unwrapResult(result));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      void queryClient.invalidateQueries({ queryKey: ["posts", "author"] });
    },
  });
}

export function useUpdatePost() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PostInput & { id: bigint }): Promise<Post> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.updatePost(
        input.id,
        input.title,
        input.content,
      );
      return normalizePost(unwrapResult(result));
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      void queryClient.invalidateQueries({ queryKey: ["posts", "author"] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.post(variables.id),
      });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint): Promise<void> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.deletePost(id);
      unwrapResult(result);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      void queryClient.invalidateQueries({ queryKey: ["posts", "author"] });
    },
  });
}

/* --------------------------------------------------------------- profiles */

export function useMyProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: async (): Promise<Profile | null> => {
      if (!actor) return null;
      const profile = await actor.getMyProfile();
      return profile ? normalizeProfile(profile) : null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProfile(id: string | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.profile(id ?? ""),
    queryFn: async (): Promise<Profile | null> => {
      if (!actor || !id) return null;
      const profile = await actor.getProfile(principalFromText(id));
      return profile ? normalizeProfile(profile) : null;
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileInput): Promise<Profile> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.createProfile(
        input.displayName,
        input.username,
        input.bio,
      );
      return normalizeProfile(unwrapResult(result));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileInput): Promise<Profile> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.updateProfile(
        input.displayName,
        input.username,
        input.bio,
      );
      return normalizeProfile(unwrapResult(result));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });
}
