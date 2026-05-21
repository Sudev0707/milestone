# Convert TanStack Router to React Router (with folder/file structure) + TanStack removal checklist

This repo currently uses **TanStack Router** (including generated `routeTree.gen.ts`, a `src/router.tsx` factory, and TanStack Start SSR integration).

The goal of this doc is:
1. Explain how to replace TanStack Router with **React Router**.
2. Provide a recommended **folder/file structure**.
3. List the **complete TanStack removal steps**.

---

## 0) What you’re converting (current state)
From the repo:
- `src/router.tsx` creates a TanStack Router via `createRouter({ routeTree, context })`.
- `src/routeTree.gen.ts` is **auto-generated** (file routes are defined under `src/routes/*`).
- `src/routes/__root.tsx` defines the root layout for TanStack Router (includes `<HeadContent />`, `<Scripts />`, `<Outlet />`, etc.).
- App content is ultimately rendered inside `src/components/AppShell.tsx` (which switches views via Zustand store `useApp()`), so routing is minimal (currently likely only `/`).

Because routing is minimal, the migration is simpler: you can replace the router plumbing while leaving most UI components untouched.

---

## 1) Target: Recommended folder/file structure for React Router
Create a dedicated router module and route components.

Example structure:

```text
src/
  router/
    index.tsx                  # Creates browser router + wraps app
    AppRoutes.tsx              # Defines <Routes> / <Route>
    routeTypes.ts             # Optional: centralized typing / constants
  routes/
    AppShellRoute.tsx         # Optional: route-level wrapper(s)
  main.tsx                     # (or existing entry) mounts React Router
```

Notes:
- Keep `src/components/*` for UI/layout.
- Keep `src/features/*` for feature views.
- Put route wiring in `src/router/*` so you can swap router libraries without touching UI logic.

---

## 2) Add React Router dependencies
Install React Router and (optionally) the dev SSR types.

Typical client-only setup:
```bash
npm i react-router-dom
```

If you intend to support SSR with React Router on this project, you’ll need additional SSR-specific wiring. (This repo uses TanStack Start for SSR; removing TanStack Start may be a bigger decision—see checklist below.)

---

## 3) Implement React Router equivalents

### 3.1 Create `src/router/index.tsx`
Responsibilities:
- Create the top-level routing component.
- Wrap any providers required by the app (ex: `QueryClientProvider`).

Recommended approach for this repo (based on TanStack `context: { queryClient }`):
- Move `QueryClient` creation to the React Router entry layer.

Skeleton:

```tsx
// src/router/index.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./AppRoutes";

const queryClient = new QueryClient();

export function RouterProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### 3.2 Create `src/router/AppRoutes.tsx`
Responsibilities:
- Define `<Routes>` and `<Route>`.

If you only have `/` right now:

```tsx
// src/router/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/AppShell";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
```

### 3.3 Replace TanStack entry mounting
TanStack Router currently appears to be bootstrapped via TanStack Start. You must update the client entry to use React Router.

Common mapping:
- TanStack: `getRouter()` + TanStack Start `Register` plumbing + TanStack `<RouterProvider router={router} />` or Start’s integration.
- React Router: mount the root component wrapped in `BrowserRouter` (as shown above).

In this repo, locate the file that mounts React/TanStack (often `src/start.ts`, `src/server.ts`, `src/routeTree.gen.ts`, and a client entry such as `src/start.ts` usage elsewhere like `src/main.tsx` or similar). In your repo listing, `src/start.ts` and `src/server.ts` exist, but a non-TanStack React entry wasn’t visible in the earlier file list—so the actual mount point may be implicit via TanStack Start.

When you locate it, do:
- Remove TanStack Router provider usage.
- Mount `RouterProvider` (from `src/router/index.tsx`).

---

## 4) Migrating “folder + file routes” to React Router
TanStack Router uses file-based routing (generated from `src/routes/*`). React Router does not generate routes from file names by default.

Migration strategy:
1. Identify every TanStack file route under `src/routes/*`.
2. For each route, create an equivalent React Router `<Route>` in `src/router/AppRoutes.tsx`.
3. Keep your route components as wrappers to preserve behavior.

Example mapping table:

| TanStack route file | React Router equivalent |
|---|---|
| `src/routes/__root.tsx` | `src/router/AppRoutes.tsx` layout wrapper or shared layout route |
| `src/routes/index.tsx` | `<Route path="/" element={<AppShell />} />` |
| additional `src/routes/foo.tsx` | `<Route path="/foo" element={<FooView/>} />` |

Because your UI uses Zustand `view` to switch between dashboard/roadmap/etc, you can choose:
- Keep a single route `/` and use store-driven view switching (minimal routing change).
- Or translate store-driven views into proper URL routes (`/dashboard`, `/roadmap`, etc.).

If you want URLs to reflect state:
- Replace `setView("roadmap")` usage with `navigate("/roadmap")` (React Router `useNavigate`).
- Replace `Sidebar` button handlers similarly.

---

## 5) Complete TanStack removal steps (checklist)
Do these in a controlled order.

### 5.1 Remove route-tree artifacts
- Delete `src/routeTree.gen.ts`.
- Delete `src/routes/*` files that exist only for TanStack routing.
- Remove `src/router.tsx` if it only builds TanStack Router.

### 5.2 Remove TanStack Router usage
Search for and remove imports/usages of:
- `@tanstack/react-router`
- `routeTree`
- `createRouter`
- `Outlet`, `Link` from TanStack
- `useRouter` from TanStack

(After removal, you’ll replace:
- TanStack `Link` -> React Router `Link`
- TanStack `useRouter` -> React Router `useNavigate` / `useLocation` as appropriate.)

### 5.3 Decide what to do about TanStack Start (SSR)
Your repo contains:
- `src/start.ts`
- `src/server.ts`

These are TanStack Start SSR integration points.

Options:
- **If you only need client-side routing:** remove TanStack Start entirely and switch to plain Vite SPA entry.
- **If you need SSR:** you must rework SSR integration (React Router on server) and you may keep TanStack Start as an SSR runtime but stop using TanStack Router. That is possible but requires careful integration.

Most teams doing this conversion choose to:
- Remove TanStack Router.
- Keep TanStack Start if it’s required.
- Or remove TanStack Start if SSR is not essential.

### 5.4 Remove TanStack Router dependencies
From `package.json`, remove:
- `@tanstack/react-router`
- `@tanstack/router-plugin` (and any TanStack Router plugin config)

Also remove TanStack Start router-specific packages only if you remove Start completely:
- `@tanstack/react-start`
- `@tanstack/start-server-core`

### 5.5 Update tooling config
Remove/adjust any config that was needed by TanStack Router.
Examples to check:
- `vite.config.ts` (TanStack router plugin)
- `tsconfig.json` path aliases if they were router-generated (less likely)
- ESLint/prettier exclusions for generated TanStack routes

### 5.6 Replace any generated navigation components
If you used TanStack `Link` previously, replace with React Router `Link`.
If you used TanStack `router.invalidate()` etc, map it to app-specific data fetching.

### 5.7 Add React Router navigation + 404
Ensure you have:
- A catch-all `<Route path="*" ... />`
- Any redirects (`<Navigate />`) that matched TanStack behavior

### 5.8 Verify build + runtime
Run:
- `npm run lint`
- `npm run build`
- `npm run dev`

---

## 6) Practical notes for this specific app
This app’s main content is controlled by Zustand store `view` in:
- `src/components/AppShell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Topbar.tsx`

So your migration can be done in two phases:
1. **Phase A (routing plumbing only):** Keep one route `/` that renders `AppShell`. No need to rewrite all “setView(...)” calls.
2. **Phase B (URL-driven views):** Introduce routes like `/dashboard`, `/roadmap`, etc., and use React Router navigation instead of store-only view switching.

---

## 7) Suggested next steps
1. Confirm how the app is currently mounted (the client entry) in this repo.
2. Create `src/router/index.tsx` + `src/router/AppRoutes.tsx`.
3. Update the client entry to mount React Router.
4. Delete TanStack routing files (`src/routes/*`, `src/routeTree.gen.ts`) and TanStack router factory `src/router.tsx`.
5. Remove TanStack dependencies.
6. Decide whether TanStack Start remains (SSR) or is removed.
7. Run build/dev and fix any remaining imports.

