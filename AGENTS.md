# Project Guidance

## User Preferences

- Modern, clean blogging design: navigation bar, hero section, card-based post grid, footer with links and social icons.
- Responsive layout on mobile, tablet and desktop.
- Post content is written in a rich text editor with bold, italic, headings, lists and links, and rendered as formatted content on the post page.

## Accepted Requirements

[Filled after each deployed build — what the user asked for and the build delivered]

## Verified Commands

- **typecheck**: `pnpm typecheck (from src/frontend/); mops check --fix (from src/backend/)`
- **fix**: `pnpm fix (from src/frontend/)`
- **build**: `pnpm build (from src/frontend/)`

## Learnings

- Type the frontend actor from the generated bindings (useActor(createActor)) instead of casting to a hand-written interface: the generated methods return Result wrappers ({__kind__:"ok"|"err"}) and opt ([] | [T]), and a cast hides the mismatch until runtime.
- Normalize Principal values to text (toText()) before comparing a record's author with the signed-in principal; a Principal object never equals a principal string.
- React Query v5 reports isPending: true and isLoading: false for a disabled query, so gate first-render loading states on isPending to avoid flashing a not-found or empty state before the actor is ready.
- Invalidate the author-scoped post list key (['posts','author']) as well as the global list after create, update and delete, or the dashboard and profile lists stay stale.
- Biome a11y/useSemanticElements rejects role="status" on <p> or <div>; use <output> for inline status feedback.
- Guard decorative animations with motion-safe: variants so they honor prefers-reduced-motion.
- Backend write endpoints must reject the anonymous principal with Principal.isAnonymous(caller) and a typed error variant; read endpoints stay public.
- Keep at most one pending migration in the chain: fold new stable-state initialization into the latest pending migration file rather than adding a second one.
