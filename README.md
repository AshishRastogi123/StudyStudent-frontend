# StudyStudent Frontend

Responsive React 19 + Vite frontend for the existing StudyStudent API. The application uses Tailwind CSS, React Router, Redux Toolkit, Axios, React Hook Form/Zod, Motion, Radix UI primitives, Lucide, Sonner, Recharts, React Dropzone, and React PDF.

## Run locally

1. Start the existing backend. Its checked-in example configuration uses port `3000`.
2. Copy `.env.example` to `.env` if you need to change the API connection.
3. Run `npm install`, then `npm run dev`.

The Vite development server proxies `/api` to `VITE_BACKEND_ORIGIN` (defaults to `http://localhost:3000`) and removes the browser `Origin` header on that local proxy hop, avoiding the backend's default CORS allowlist mismatch during development. Set `VITE_API_BASE_URL` to `/api` for that proxy, or to the deployed API URL (including `/api`) when hosting the frontend separately. Production deployments must configure the backend's `ALLOWED_ORIGINS` for the frontend origin and enable credentialed CORS.

## Implemented frontend

- Public landing page, features/how-it-works, about, contact information, searchable public notes, note details, sign-in, and registration.
- Student dashboard, private note submissions, supported multipart uploads with progress, status/rejection feedback, secure file access, bookmarks, academic hierarchy browsing, and notifications.
- Role-gated moderator/admin dashboards, pending review queue with approve/reject actions, report listing, and admin course/subject creation.
- Responsive layouts, light/dark workspace themes, reduced-motion handling, route transitions, scroll reveals, accessible Radix dialogs/menus, drag-and-drop, and PDF previews.

## Source structure

- `src/components/` — reusable cards, controls, dialogs, note cards, and previews
- `src/features/auth/` — authentication state and session actions
- `src/hooks/` — reusable API resource lifecycle
- `src/layouts/` — public site and authenticated workspace shells
- `src/pages/` — public, student, library, and moderation pages
- `src/routes/` — authentication and role guards
- `src/services/` — centralized API client and verified endpoint wrappers
- `src/store/` — Redux store setup
- `src/utils/` — shared formatting helpers
- `src/styles.css` — responsive design tokens and component styles

## Verified backend API map

All paths below are relative to `/api`. Request names and query formats match the backend routes in `routes/`.

| Frontend capability | Backend API |
|---|---|
| Register / sign in | `POST /auth/register` (`name`, `email`, `password`); `POST /auth/login` (`email`, `password`) |
| Restore / end session | `GET /auth/me`; `POST /auth/logout` |
| Profile update | `PUT /auth/profile` |
| Student metrics and recent activity | `GET /notes/my-notes`; `GET /notes/bookmarks`; `GET /notifications` |
| Upload a note | `POST /notes/upload` multipart fields: `file`, `title`, `description`, `courseId`, `subjectId` |
| Supported upload files | PDF, DOC/DOCX, PPT/PPTX, TXT, PNG, JPG/JPEG; maximum 10 MB, one file |
| Public note search | `GET /notes/public?q=&courseId=&subjectId=&page=&limit=`; server returns `{ notes, pagination: { page, limit, total, pages } }` |
| Public details | `GET /notes/:id` (approved and public only) |
| Authorized file access | `GET /notes/:id/download`; Supabase files return a signed URL valid for one hour |
| Bookmark toggle / report | `POST /notes/:id/bookmark`; `POST /notes/:id/report` (`reason`, optional `details`) |
| Academic hierarchy | `GET /academic/hierarchy`; individual `GET /academic/courses`, `/subjects?courseId=`, `/units?subjectId=`, `/topics?unitId=` |
| Admin academic creation | `POST /academic/courses` and `POST /academic/subjects` (ADMIN only) |
| Admin overview | `GET /dashboard/overview` |
| Moderation | `GET /notes/queue`; `POST /notes/:id/review` with `action` (`approved`, `rejected`, `removed`) and supported rejection `reason` |
| Reports | `GET /notes/reports` |
| Notifications | `GET /notifications`; `PATCH /notifications/:id/read`; `PATCH /notifications/mark-all-read` |
| Role checks | Backend uses `STUDENT`, `MODERATOR`, and `ADMIN`; queue/reports/review require MODERATOR or ADMIN, academic creation requires ADMIN |

The centralized Axios client is in `src/services/api.js`. Its base URL is configurable with `VITE_API_BASE_URL`. Uploads and downloads go through backend APIs; no Supabase service key or other backend secret is shipped to the browser.

The backend must have its Supabase URL, service-role key, and storage bucket configured server-side for multipart uploads and signed file access. Do not copy those values into this frontend's Vite environment.

## Authentication contract and integration notes

The backend returns a JWT from login/registration and also sets an HttpOnly cookie. The cookie name defaults to `studystudent_session`, but `middleware/auth.js` only checks a cookie named `token` or a bearer authorization header. The frontend keeps the returned JWT in `sessionStorage` and sends it as a bearer token so protected APIs work with the current backend. Aligning the cookie name/middleware would allow a future HttpOnly-cookie-only flow.

The backend's `/auth/google` handler accepts a name/email/avatar body without validating a Google ID token; the frontend intentionally does not expose it as Google OAuth. This avoids treating unverified client-supplied identity as authentication.

## Missing backend dependencies / unsupported workflows

- **Verified Google OAuth:** add server-side ID-token verification and a defined OAuth client/callback contract before exposing Google sign-in.
- **Contact submission:** no public contact endpoint or configured support address is available; the Contact page explains the supported in-product reporting route.
- **Email verification and password recovery delivery:** verification/reset routes exist, but no email delivery/resend contract is present; registration currently reports the backend response and does not invent a delivery flow.
- **Note resubmission/editing:** there is no resubmit/update route. Students can see rejection feedback and delete notes; rejected notes cannot be resubmitted in place.
- **File previews for local storage:** download access returns a local storage path, not a browser-accessible file stream/URL. Preview/download needs a backend file-serving route for local storage. Supabase signed URLs are supported.
- **Report resolution and review history:** reports can be listed but not resolved or dismissed; review records cannot be queried through an API.
- **User management:** role updates exist (`PATCH /auth/users/:id/role`) but no user-list/search API is available, so a safe user-management screen cannot be built.
- **Catalog administration:** adding courses/subjects is supported. Unit/topic hierarchy can be browsed, but the admin interface does not manage units/topics; editing/deactivation APIs are also absent.
- **Student analytics:** `/dashboard/overview` is platform-wide rather than scoped to the current student. The student dashboard derives its counts from the authenticated user's notes/bookmarks instead.

## Validation

- `npm run build` — production Vite build.
- `npm audit` — dependency audit.
