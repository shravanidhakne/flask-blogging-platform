mixin () {
  public query func getApiDoc() : async Text {
    "# Blogging Backend API\n" #
    "\n" #
    "## Purpose\n" #
    "\n" #
    "This canister backs a public blogging application. It stores user profiles and blog posts, and exposes read endpoints to anyone and write endpoints to signed-in users. Profiles are created on first sign-in and are editable only by their owner. Any signed-in user with a registered profile may publish posts; there is no admin approval flow. Posts are editable and deletable only by their author.\n" #
    "\n" #
    "## Authentication and identity\n" #
    "\n" #
    "Sign-in uses Internet Identity. The caller principal is the identity: every write endpoint derives the acting user from the caller principal, never from a parameter. A caller that has not signed in is the anonymous principal and cannot write.\n" #
    "\n" #
    "The app's frontend pins an Internet Identity derivation origin, published at `/.well-known/ii-derivation-origin` when available. An agent already holding the user's Internet Identity authorization derives the correct per-app principal against that origin (for example `icp identity link web <name> --app <host>`). Such a delegation acts with the user's full authority in this app until it expires.\n" #
    "\n" #
    "A principal that never signed in through this app's frontend is unregistered even if it belongs to the app's owner, and a signed-in caller derived against a different origin is a different principal than the one the frontend registered.\n" #
    "\n" #
    "## Authorization\n" #
    "\n" #
    "- Read endpoints (`getMyProfile`, `getProfile`, `listPosts`, `listPostsByAuthor`, `getPost`) are open to anyone, including anonymous callers.\n" #
    "- Write endpoints (`createProfile`, `updateProfile`, `createPost`, `updatePost`, `deletePost`) require a signed-in (non-anonymous) caller.\n" #
    "- `createPost` additionally requires the caller to have a registered profile; otherwise it returns `#notRegistered`.\n" #
    "- `updateProfile` requires the caller to have a registered profile; otherwise it returns `#notRegistered`.\n" #
    "- `updatePost` and `deletePost` succeed only when the caller is the post's author; otherwise they return `#notAuthor`.\n" #
    "- Access-control endpoints provided by the authorization mixin manage roles and are unchanged by this domain.\n" #
    "\n" #
    "## Units and encodings\n" #
    "\n" #
    "- Timestamps (`createdAt`, `updatedAt`) are `Int` nanoseconds since the Unix epoch, as produced by `Time.now()`. They are signed but never negative in practice.\n" #
    "- `id` on a profile is the owner's `Principal`. `id` on a post is a `Nat` assigned by the canister, starting at 0 and increasing by one per created post.\n" #
    "- Post `content` is rich-text HTML produced by the editor (bold, italic, headings, lists, links). It is stored and returned as a `Text` string and must be rendered as formatted content, not escaped as plain text.\n" #
    "- `authorName` and `authorUsername` on a post are denormalized from the author's profile at write time and are not updated when the profile later changes.\n" #
    "- Optional values (`?T`) are Candid `opt`; absence is `null`.\n" #
    "\n" #
    "## Lifecycle and polling\n" #
    "\n" #
    "- A profile is created by an explicit `createProfile` call after sign-in; it is not created automatically. `getMyProfile` returns `null` until then.\n" #
    "- Post ids are assigned on creation and never reused. `listPosts` and `listPostsByAuthor` return posts newest first by `createdAt`.\n" #
    "- There is no asynchronous work and no job to poll: every call completes within its own message. A successful write is immediately visible to subsequent reads.\n" #
    "\n" #
    "## Mutation retry safety\n" #
    "\n" #
    "- `createProfile` is not idempotent: a second call for an already-registered caller overwrites the existing profile (it behaves like an update). Retrying a failed create is safe only when the first attempt did not commit.\n" #
    "- `createPost` is not idempotent: each successful call creates a new post with a new id. Retrying after a timeout may create a duplicate post.\n" #
    "- `updateProfile`, `updatePost` and `deletePost` are idempotent in effect: repeating them with the same arguments leaves the same final state. `deletePost` on an already-deleted id returns `#notFound`.\n" #
    "- A rejected call rolls back its uncommitted state changes; a call that returned a value has committed.\n" #
    "\n" #
    "## Errors\n" #
    "\n" #
    "Profile operations return `Result<ProfileView, ProfileError>` with variants:\n" #
    "\n" #
    "- `#notRegistered` — the caller has no profile (returned by `updateProfile`).\n" #
    "- `#usernameTaken : Text` — the username is claimed by another profile (case-insensitive).\n" #
    "- `#invalidUsername : Text` — the username is empty or contains whitespace.\n" #
    "- `#invalidDisplayName : Text` — the display name is empty.\n" #
    "\n" #
    "Post operations return `Result<PostView, PostError>` (or `Result<(), PostError>` for delete) with variants:\n" #
    "\n" #
    "- `#notFound : Nat` — no post with that id.\n" #
    "- `#notAuthor` — the caller is not the post's author.\n" #
    "- `#notRegistered` — the caller has no profile (returned by `createPost`).\n" #
    "- `#invalidTitle : Text` — the title is empty or whitespace only.\n" #
    "- `#invalidContent : Text` — the content is empty or whitespace only.\n" #
    "\n" #
    "## Gotchas\n" #
    "\n" #
    "- `getProfile` takes a `Principal` argument and returns `null` for an unregistered principal; it does not reveal whether the principal has ever signed in.\n" #
    "- `listPosts` returns every post in one call; there is no pagination in this iteration.\n" #
    "- Usernames are compared case-insensitively for uniqueness but stored as entered (trimmed).\n" #
    "- Title and content are trimmed of surrounding whitespace before storage."
  };
};
