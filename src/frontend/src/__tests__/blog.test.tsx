import type {
  PostView,
  ProfileView,
  Result,
  Result_1,
  Result_2,
  backendInterface,
} from "@/backend";
import {
  useCreatePost,
  useDeletePost,
  usePostsByAuthor,
  useUpdatePost,
} from "@/hooks/useQueries";
import { DashboardPage } from "@/pages/DashboardPage";
import { HomePage } from "@/pages/HomePage";
import { PostDetailPage } from "@/pages/PostDetailPage";
import { PostEditorPage } from "@/pages/PostEditorPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SignInPage } from "@/pages/SignInPage";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { setIdentityForTest } from "./setup";
import { renderWithActor } from "./test-utils";

/**
 * The pages read the signed-in principal from `useInternetIdentity`, the actor
 * from `useActor`, and route state from TanStack Router. The prepared setup
 * mocks the first two; `renderPage` mounts the page under a real memory router
 * so `useParams`, `useNavigate` and `Link` resolve as they do in the app.
 *
 * The fake actor speaks the *generated* binding shapes the repaired hooks
 * consume: `Result`/`Result_1`/`Result_2` wrappers with a `__kind__` tag,
 * `PostView`/`ProfileView` records whose `author`/`id` are `Principal`s, and
 * `null` for an absent optional. The hooks normalize these to the app's
 * `Post`/`Profile` types (string ids, unwrapped values), so the pages render
 * the same data a real canister would produce.
 */

const ALICE = "aaaaa-aa";
const BOB = "bbbbb-bb";

/** A minimal `Principal` stand-in: the hooks only call `toText()`. */
function principalFor(text: string) {
  return {
    toText: () => text,
    isAnonymous: () => false,
    getPrincipal: () => ({ toText: () => text, isAnonymous: () => false }),
  };
}

function signInAs(text: string) {
  setIdentityForTest({ identity: principalFor(text) as never });
}

/** A generated `ProfileView` whose `id` is a `Principal`. */
function makeProfileView(overrides: Partial<ProfileView> = {}): ProfileView {
  return {
    id: principalFor(ALICE) as never,
    displayName: "Ada Lovelace",
    username: "ada_writes",
    bio: "Writing about engines.",
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

/** A generated `PostView` whose `author` is a `Principal`. */
function makePostView(overrides: Partial<PostView> = {}): PostView {
  return {
    id: 1n,
    author: principalFor(ALICE) as never,
    authorName: "Ada Lovelace",
    authorUsername: "ada_writes",
    title: "On the Analytical Engine",
    content: "<p>The engine weaves algebraic patterns.</p>",
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function okProfile(view: ProfileView = makeProfileView()): Result {
  return { __kind__: "ok", ok: view };
}

function okPost(view: PostView = makePostView()): Result_1 {
  return { __kind__: "ok", ok: view };
}

function okUnit(): Result_2 {
  return { __kind__: "ok", ok: null };
}

/**
 * The actor contract the pages actually consume, typed from the generated
 * `backendInterface` so the fake cannot drift from the real binding shapes.
 * Only the methods the tested pages call are supplied.
 */
type BlogActor = Pick<
  backendInterface,
  | "getMyProfile"
  | "getProfile"
  | "createProfile"
  | "updateProfile"
  | "listPosts"
  | "listPostsByAuthor"
  | "getPost"
  | "createPost"
  | "updatePost"
  | "deletePost"
>;

/** A typed fake actor exposing only the methods the tested pages call. */
function fakeActor(overrides: Partial<BlogActor> = {}): BlogActor {
  return {
    getMyProfile: vi.fn<BlogActor["getMyProfile"]>(async () => null),
    getProfile: vi.fn<BlogActor["getProfile"]>(async () => null),
    createProfile: vi.fn<BlogActor["createProfile"]>(async () => okProfile()),
    updateProfile: vi.fn<BlogActor["updateProfile"]>(async () => okProfile()),
    listPosts: vi.fn<BlogActor["listPosts"]>(async () => []),
    listPostsByAuthor: vi.fn<BlogActor["listPostsByAuthor"]>(async () => []),
    getPost: vi.fn<BlogActor["getPost"]>(async () => null),
    createPost: vi.fn<BlogActor["createPost"]>(async () => okPost()),
    updatePost: vi.fn<BlogActor["updatePost"]>(async () => okPost()),
    deletePost: vi.fn<BlogActor["deletePost"]>(async () => okUnit()),
    ...overrides,
  };
}

/**
 * Mount a page under a real memory router. `path` is the route the page is
 * registered at and `initialPath` is where the router starts, so a page that
 * reads `$id` can be given one.
 */
function renderPage(
  page: () => ReactElement,
  actor: BlogActor,
  {
    path = "/",
    initialPath = "/",
  }: { path?: string; initialPath?: string } = {},
) {
  const rootRoute = createRootRoute();
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path,
    component: page,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return renderWithActor(
    <RouterProvider router={router} />,
    actor as unknown as Parameters<typeof renderWithActor>[1],
  );
}

describe("accounts and profiles", () => {
  it("lets a signed-in visitor create a profile with display name, username and bio", async () => {
    signInAs(ALICE);
    const actor = fakeActor();
    const user = userEvent.setup();
    renderPage(SignInPage, actor);

    const form = await screen.findByTestId("profile.setup_card");
    await user.type(
      within(form).getByTestId("profile.display_name_input"),
      "Ada Lovelace",
    );
    await user.type(
      within(form).getByTestId("profile.username_input"),
      "ada_writes",
    );
    await user.type(
      within(form).getByTestId("profile.bio_textarea"),
      "Writing about engines.",
    );
    await user.click(within(form).getByTestId("profile.submit_button"));

    await waitFor(() => {
      expect(actor.createProfile).toHaveBeenCalledWith(
        "Ada Lovelace",
        "ada_writes",
        "Writing about engines.",
      );
    });
    expect(await screen.findByTestId("profile.success_state")).toBeVisible();
  });

  it("lets a signed-in user edit their own profile information", async () => {
    signInAs(ALICE);
    const actor = fakeActor({
      getMyProfile: vi.fn<BlogActor["getMyProfile"]>(async () =>
        makeProfileView(),
      ),
      updateProfile: vi.fn<BlogActor["updateProfile"]>(async () =>
        okProfile(
          makeProfileView({
            displayName: "Ada L.",
            bio: "Now writing about engines and music.",
          }),
        ),
      ),
    });
    const user = userEvent.setup();
    renderPage(ProfilePage, actor);

    await user.click(await screen.findByTestId("profile.edit_button"));
    const form = await screen.findByTestId("profile.form");
    const displayName = within(form).getByTestId("profile.display_name_input");
    await user.clear(displayName);
    await user.type(displayName, "Ada L.");
    const bio = within(form).getByTestId("profile.bio_textarea");
    await user.clear(bio);
    await user.type(bio, "Now writing about engines and music.");
    await user.click(within(form).getByTestId("profile.submit_button"));

    await waitFor(() => {
      expect(actor.updateProfile).toHaveBeenCalledWith(
        "Ada L.",
        "ada_writes",
        "Now writing about engines and music.",
      );
    });
  });

  it("surfaces a backend profile error instead of a false success", async () => {
    signInAs(ALICE);
    const actor = fakeActor({
      createProfile: vi.fn<BlogActor["createProfile"]>(async () => ({
        __kind__: "err",
        err: { __kind__: "usernameTaken", usernameTaken: "ada_writes" },
      })),
    });
    const user = userEvent.setup();
    renderPage(SignInPage, actor);

    const form = await screen.findByTestId("profile.setup_card");
    await user.type(
      within(form).getByTestId("profile.display_name_input"),
      "Ada Lovelace",
    );
    await user.type(
      within(form).getByTestId("profile.username_input"),
      "ada_writes",
    );
    await user.click(within(form).getByTestId("profile.submit_button"));

    expect(await screen.findByTestId("profile.error_state")).toBeVisible();
    expect(screen.queryByTestId("profile.success_state")).toBeNull();
  });
});

describe("blog post management", () => {
  it("lets a signed-in user create a post with a title and rich-text content", async () => {
    signInAs(ALICE);
    const actor = fakeActor();
    const user = userEvent.setup();
    renderPage(PostEditorPage, actor, { path: "/new", initialPath: "/new" });

    const title = await screen.findByTestId("editor.title_input");
    await user.type(title, "On the Analytical Engine");

    // The rich-text editor is a contenteditable surface; type into it directly
    // so the stored content is the formatted HTML the editor produces.
    const editor = document.querySelector(".ql-editor");
    expect(editor).not.toBeNull();
    await user.click(editor as HTMLElement);
    await user.type(editor as HTMLElement, "The engine weaves patterns.");

    await user.click(screen.getByTestId("editor.submit_button"));

    await waitFor(() => {
      expect(actor.createPost).toHaveBeenCalledWith(
        "On the Analytical Engine",
        expect.stringContaining("The engine weaves patterns."),
      );
    });
  });

  it("shows each post's author and creation date on the home feed", async () => {
    signInAs(ALICE);
    const actor = fakeActor({
      listPosts: vi.fn<BlogActor["listPosts"]>(async () => [makePostView()]),
    });
    renderPage(HomePage, actor);

    const card = await screen.findByTestId("post.card.1");
    expect(within(card).getByText("Ada Lovelace")).toBeVisible();
    expect(within(card).getByText("On the Analytical Engine")).toBeVisible();
    expect(card.querySelector("time")).not.toBeNull();
  });

  it("shows the author and creation date on a post detail page", async () => {
    signInAs(ALICE);
    const actor = fakeActor({
      getPost: vi.fn<BlogActor["getPost"]>(async () => makePostView()),
    });
    renderPage(PostDetailPage, actor, {
      path: "/post/$id",
      initialPath: "/post/1",
    });

    const page = await screen.findByTestId("post.page");
    expect(within(page).getByText("Ada Lovelace")).toBeVisible();
    expect(within(page).getByText("@ada_writes")).toBeVisible();
    expect(page.querySelector("time")).not.toBeNull();
  });

  it("lets the author edit and delete their own post", async () => {
    signInAs(ALICE);
    const actor = fakeActor({
      getPost: vi.fn<BlogActor["getPost"]>(async () => makePostView()),
    });
    const user = userEvent.setup();
    renderPage(PostDetailPage, actor, {
      path: "/post/$id",
      initialPath: "/post/1",
    });

    expect(await screen.findByTestId("post.edit_button")).toBeVisible();
    await user.click(screen.getByTestId("post.delete_button"));
    await user.click(await screen.findByTestId("post.confirm_button"));

    await waitFor(() => {
      expect(actor.deletePost).toHaveBeenCalledWith(1n);
    });
  });

  it("hides edit and delete controls from a non-author", async () => {
    signInAs(BOB);
    const actor = fakeActor({
      getPost: vi.fn<BlogActor["getPost"]>(async () => makePostView()),
    });
    renderPage(PostDetailPage, actor, {
      path: "/post/$id",
      initialPath: "/post/1",
    });

    await screen.findByTestId("post.page");
    expect(screen.queryByTestId("post.edit_button")).toBeNull();
    expect(screen.queryByTestId("post.delete_button")).toBeNull();
  });

  it("lists only the signed-in user's posts on the dashboard", async () => {
    signInAs(ALICE);
    const actor = fakeActor({
      getMyProfile: vi.fn<BlogActor["getMyProfile"]>(async () =>
        makeProfileView(),
      ),
      listPostsByAuthor: vi.fn<BlogActor["listPostsByAuthor"]>(async () => [
        makePostView(),
      ]),
    });
    renderPage(DashboardPage, actor);

    await waitFor(() => {
      expect(actor.listPostsByAuthor).toHaveBeenCalledWith(
        expect.objectContaining({ toText: expect.any(Function) }),
      );
    });
    expect(await screen.findByTestId("dashboard.post.item.1")).toBeVisible();
  });
});

/**
 * The repaired invalidation contract: a post mutation must refresh the
 * author-scoped list (`["posts", "author"]`) as well as the global list, so a
 * dashboard open beside the editor does not keep showing stale rows. The
 * harness mounts the real hooks together and drives each mutation directly.
 */
function InvalidationHarness() {
  const authorPosts = usePostsByAuthor(ALICE);
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  return (
    <div>
      <span data-ocid="harness.author_count">
        {authorPosts.data?.length ?? 0}
      </span>
      <button
        type="button"
        data-ocid="harness.create"
        onClick={() =>
          createPost.mutate({ title: "New", content: "<p>New</p>" })
        }
      >
        create
      </button>
      <button
        type="button"
        data-ocid="harness.update"
        onClick={() =>
          updatePost.mutate({
            id: 1n,
            title: "Edited",
            content: "<p>Edited</p>",
          })
        }
      >
        update
      </button>
      <button
        type="button"
        data-ocid="harness.delete"
        onClick={() => deletePost.mutate(1n)}
      >
        delete
      </button>
    </div>
  );
}

describe("post mutation invalidation", () => {
  it("refreshes the author-scoped list after create, update and delete", async () => {
    signInAs(ALICE);
    const listPostsByAuthor = vi.fn<BlogActor["listPostsByAuthor"]>(
      async () => [makePostView()],
    );
    const actor = fakeActor({ listPostsByAuthor });
    const user = userEvent.setup();
    renderWithActor(
      <InvalidationHarness />,
      actor as unknown as Parameters<typeof renderWithActor>[1],
    );

    await waitFor(() => {
      expect(listPostsByAuthor).toHaveBeenCalledTimes(1);
    });

    // Each mutation must trigger at least one refetch of the author-scoped
    // list; the global `["posts"]` invalidation may also match it by prefix, so
    // assert the count grows rather than an exact total.
    const beforeCreate = listPostsByAuthor.mock.calls.length;
    await user.click(screen.getByTestId("harness.create"));
    await waitFor(() => {
      expect(actor.createPost).toHaveBeenCalledWith("New", "<p>New</p>");
      expect(listPostsByAuthor.mock.calls.length).toBeGreaterThan(beforeCreate);
    });

    const beforeUpdate = listPostsByAuthor.mock.calls.length;
    await user.click(screen.getByTestId("harness.update"));
    await waitFor(() => {
      expect(actor.updatePost).toHaveBeenCalledWith(
        1n,
        "Edited",
        "<p>Edited</p>",
      );
      expect(listPostsByAuthor.mock.calls.length).toBeGreaterThan(beforeUpdate);
    });

    const beforeDelete = listPostsByAuthor.mock.calls.length;
    await user.click(screen.getByTestId("harness.delete"));
    await waitFor(() => {
      expect(actor.deletePost).toHaveBeenCalledWith(1n);
      expect(listPostsByAuthor.mock.calls.length).toBeGreaterThan(beforeDelete);
    });
  });
});
