import { RequireSignIn } from "@/components/InternetIdentity";
import { Layout } from "@/components/layout/Layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { HomePage } from "@/pages/HomePage";
import { PostDetailPage } from "@/pages/PostDetailPage";
import { PostEditorPage } from "@/pages/PostEditorPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SignInPage } from "@/pages/SignInPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

/**
 * Route tree for Ink & Ember.
 *
 * Each route renders a page component owned by a page task under
 * `src/frontend/src/pages/`. Until those modules land, the routes render the
 * matching placeholder from `@/lib/placeholders`; the page task swaps the
 * import for the real page module (e.g. `@/pages/HomePage`) and keeps the
 * route path unchanged.
 */

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const postDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/post/$id",
  component: PostDetailPage,
});

const newPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/new",
  component: () => (
    <RequireSignIn>
      <PostEditorPage />
    </RequireSignIn>
  ),
});

const editPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/post/$id/edit",
  component: () => (
    <RequireSignIn>
      <PostEditorPage />
    </RequireSignIn>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <RequireSignIn>
      <DashboardPage />
    </RequireSignIn>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => (
    <RequireSignIn>
      <ProfilePage />
    </RequireSignIn>
  ),
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signin",
  component: SignInPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  postDetailRoute,
  newPostRoute,
  editPostRoute,
  dashboardRoute,
  profileRoute,
  signInRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
