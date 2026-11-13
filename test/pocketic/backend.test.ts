import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";
import { registerCaller } from "./test-utils";

/**
 * The PocketIC actor is built straight from `idlFactory`, so it speaks the
 * declarations' Candid shapes: a `Result` is `{ ok } | { err }` (no `__kind__`
 * wrapper), an optional is `[] | [T]`, and a variant is `{ name: null }`.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

const alice = createIdentity("alice");
const bob = createIdentity("bob");

/** A fresh actor for the given identity, registered through the public API. */
async function signedInActor(identity: ReturnType<typeof createIdentity>) {
  const actor = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  return registerCaller(actor, identity);
}

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  const fixture = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  });
  canisterId = fixture.canisterId;
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  const actor = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(actor.listPosts()).resolves.toEqual([]);
  await expect(actor.getPost(0n)).resolves.toEqual([]);
  await expect(actor.getMyProfile()).resolves.toEqual([]);
});

it("creates a profile with display name, username and bio", async () => {
  const actor = await signedInActor(alice);
  const result = await actor.createProfile(
    "Ada Lovelace",
    "ada_writes",
    "Writing about engines.",
  );
  expect("ok" in result).toBe(true);
  if (!("ok" in result)) return;
  expect(result.ok).toMatchObject({
    displayName: "Ada Lovelace",
    username: "ada_writes",
    bio: "Writing about engines.",
  });
  expect(result.ok.createdAt).toBeGreaterThan(0n);

  const mine = await actor.getMyProfile();
  expect(mine).toHaveLength(1);
  expect(mine[0]).toMatchObject({ username: "ada_writes" });
});

it("edits the caller's own profile information", async () => {
  const actor = await signedInActor(alice);
  const result = await actor.updateProfile(
    "Ada L.",
    "ada_writes",
    "Now writing about engines and music.",
  );
  expect("ok" in result).toBe(true);
  if (!("ok" in result)) return;
  expect(result.ok).toMatchObject({
    displayName: "Ada L.",
    bio: "Now writing about engines and music.",
  });
  expect(result.ok.updatedAt).toBeGreaterThanOrEqual(result.ok.createdAt);
});

it("creates a post with a title and rich-text content, showing author and dates", async () => {
  const actor = await signedInActor(alice);
  const result = await actor.createPost(
    "On the Analytical Engine",
    "<p>The engine weaves <strong>algebraic</strong> patterns.</p>",
  );
  expect("ok" in result).toBe(true);
  if (!("ok" in result)) return;
  const post = result.ok;
  expect(post.title).toBe("On the Analytical Engine");
  expect(post.content).toContain("<strong>algebraic</strong>");
  expect(post.authorName).toBe("Ada L.");
  expect(post.authorUsername).toBe("ada_writes");
  expect(post.createdAt).toBeGreaterThan(0n);
  expect(post.updatedAt).toBe(post.createdAt);

  const fetched = await actor.getPost(post.id);
  expect(fetched).toHaveLength(1);
  expect(fetched[0]).toMatchObject({ id: post.id, title: post.title });
});

it("lets the author edit and delete their own post", async () => {
  const actor = await signedInActor(alice);
  const created = await actor.createPost("Draft", "<p>First pass.</p>");
  expect("ok" in created).toBe(true);
  if (!("ok" in created)) return;
  const id = created.ok.id;

  const updated = await actor.updatePost(id, "Revised", "<p>Second pass.</p>");
  expect("ok" in updated).toBe(true);
  if (!("ok" in updated)) return;
  expect(updated.ok.title).toBe("Revised");
  expect(updated.ok.updatedAt).toBeGreaterThanOrEqual(updated.ok.createdAt);

  const deleted = await actor.deletePost(id);
  expect("ok" in deleted).toBe(true);
  await expect(actor.getPost(id)).resolves.toEqual([]);
});

it("rejects a non-author editing or deleting someone else's post", async () => {
  const aliceActor = await signedInActor(alice);
  const created = await aliceActor.createPost("Owned by Alice", "<p>Mine.</p>");
  expect("ok" in created).toBe(true);
  if (!("ok" in created)) return;
  const id = created.ok.id;

  const bobActor = await signedInActor(bob);
  const update = await bobActor.updatePost(id, "Hijacked", "<p>Not mine.</p>");
  expect(update).toEqual({ err: { notAuthor: null } });

  const remove = await bobActor.deletePost(id);
  expect(remove).toEqual({ err: { notAuthor: null } });

  // The post is untouched.
  const stillThere = await aliceActor.getPost(id);
  expect(stillThere).toHaveLength(1);
  expect(stillThere[0]).toMatchObject({ title: "Owned by Alice" });
});

it("rejects anonymous callers creating or managing content", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(guest.createProfile("Anon", "anon", "")).resolves.toEqual({
    err: { notSignedIn: null },
  });
  await expect(guest.createPost("Anon post", "<p>Hi.</p>")).resolves.toEqual({
    err: { notSignedIn: null },
  });
  await expect(guest.updatePost(0n, "x", "<p>y</p>")).resolves.toEqual({
    err: { notSignedIn: null },
  });
  await expect(guest.deletePost(0n)).resolves.toEqual({
    err: { notSignedIn: null },
  });
});
