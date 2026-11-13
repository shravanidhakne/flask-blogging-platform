/**
 * Shared domain types for the Ink & Ember blog.
 *
 * These mirror the backend contract. Once `pnpm bindgen` regenerates
 * `@/backend` with the domain methods, the generated interfaces become the
 * source of truth; the hooks in `@/hooks/useQueries` are the only place that
 * touches the actor, so page components never depend on the binding shape.
 */

/** A blog author profile. */
export interface Profile {
  /** Principal text of the profile owner. */
  id: string;
  displayName: string;
  username: string;
  bio: string;
}

/** A published blog post. */
export interface Post {
  id: bigint;
  /** Principal text of the author. */
  author: string;
  authorName: string;
  authorUsername: string;
  title: string;
  /** Stored rich-text (HTML) content. */
  content: string;
  /** Creation time in nanoseconds since the epoch. */
  createdAt: bigint;
  /** Last update time in nanoseconds since the epoch. */
  updatedAt: bigint;
}

/** Input payload for creating or updating a profile. */
export interface ProfileInput {
  displayName: string;
  username: string;
  bio: string;
}

/** Input payload for creating or updating a post. */
export interface PostInput {
  title: string;
  content: string;
}
