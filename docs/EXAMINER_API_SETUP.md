# ExaminerApp Integration Notes

## Layout & Navigation
- The app now uses the original DashLite theme layout (`src/layout/Index.jsx` + `ThemeProvider`) so the left sidebar and header appear again.
- Sidebar menu entries have been customized to point at the core experiences: `Dashboard`, one entry per Swagger module (`Auth`, `Class`, `Exam`, `Question`, `School`, `Student`), and an “All Operations” link that opens the Swagger-driven console.
- Routing (in `src/route/Index.jsx`) protects every page behind authentication. `/login` uses the themed login screen; authenticated users are redirected to `/dashboard` by default. The “Class” entry now renders a dedicated class CRUD page (`src/pages/classes/ClassList.jsx`).

## Authentication
- `src/context/AuthContext.jsx` centrally manages token/email state and persists them under `examiner-auth-token`.
- Login now calls `POST /api/auth/login` with `{ username, password }` and stores the returned `token` (plus user email). The Swagger console, Class CRUD page, and other clients use this token for every request.
- Logout is wired to the theme’s user dropdown (`src/layout/header/dropdown/user/User.jsx`), clearing the token/email and routing back to `/login`.
- `src/pages/auth/Login.jsx` pre-fills the approved credentials (`superadmin@examiner.com` / `SuperAdmin@123`) and shows a loader while authenticating.

## API Client & Console
- `src/utils/apiClient.js` exports a generic `createApiClient` that handles base URL resolution, query/ body serialization, and Authorization headers (with a `skipToken` toggle for login).
- The API console fetches the Swagger doc at runtime via `src/hooks/useSwagger.js`, builds grouped navigation, and renders operations in `src/components/swagger/OperationRunner.jsx`. CRUD inputs for all parameters/bodies are supported, and responses are prettified.
- Sidebar navigation updates to filter operations by module tag when you visit `/api-explorer/<tag>`.
- Token is sent as `Authorization: Bearer <token>` for every request except login.

## Class CRUD Experience
- `src/pages/classes/ClassList.jsx` lists classes and supports create/edit/delete via the Examiner API (uses the shared API client).
- A slider drawer (same pattern as `nk-add-product`) contains the form (name, description, school dropdown). The dropdown is populated from `GET /api/schools`.
- Creating/editing triggers POST/PUT, deleting calls DELETE, and success/error messages are shown inline.
- “New Class” opens the drawer; edit buttons preload the form.

## Notes
- The docs ship with `/api-explorer`, `/classes`, and `/dashboard` routes, all rendered inside the standard layout.
- You can change `VITE_API_BASE` to point at a different backend (defaults to `https://examiner.ideageek.pk`).
- For production, swap the placeholder login form with your real identity provider, ensuring the token is saved where `AuthContext` expects it.
