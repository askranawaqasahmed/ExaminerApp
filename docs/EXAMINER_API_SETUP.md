# ExaminerApp Integration Notes

## Layout & Navigation
- The app reuses the DashLite theme layout (`src/layout/Index.jsx` + `ThemeProvider`), but the sidebar now lists just the essential flows: `Dashboard`, `Class`, `Exam`, `Question`, `School`, `Student`, and the Swagger console (`/api-explorer`). That keeps the navigation focused while keeping `/dashboard` as the default landing route.
- Routing (`src/route/Index.jsx`) protects every page behind authentication; `/login` renders the themed login screen and redirects authenticated users back to `/dashboard`.

## Authentication
- `src/context/AuthContext.jsx` centrally manages token/email state and persists them under `examiner-auth-token`.
- Login calls `POST /api/auth/login` with `{ username, password }` and stores the returned `token`/email. The Swagger console, CRUD clients, and download links use this token for non-public calls.
- Logout hooks into the user dropdown (`src/layout/header/dropdown/user/User.jsx`), clearing the token/email and pushing the user back to `/login`.
- `src/pages/auth/Login.jsx` pre-fills approved credentials (`superadmin@examiner.com` / `SuperAdmin@123`) and shows a loader while authenticating.

## API Client & Console
- APIs now return an envelope `{ code, date, error, message, value, count }`. `src/utils/apiClient.js` normalizes this, exposing `success`, `value`, `count`, and `message` while preserving the raw body.
- `src/utils/apiClient.js` builds URLs, serializes bodies/queries, and attaches `Authorization` headers (with a `skipToken` toggle for login).
- The API console fetches Swagger at runtime via `src/hooks/useSwagger.js`, edifies grouped navigation, and renders operations with `src/components/swagger/OperationRunner.jsx`. CRUD inputs for all parameters/bodies are supported, and responses are prettified.
- Sidebar navigation filters operations by the current module tag when visiting `/api-explorer/<tag>`, and the downloaded tokens are sent as `Authorization: Bearer <token>` on every request except login.

## Class CRUD Experience
- `src/pages/classes/ClassList.jsx` lists classes using the shared client and the `/api/classes` endpoints.
- The `nk-add-product` drawer handles `name`, `section`, and `school` selection (schools from `GET /api/schools`). Creating posts to `/api/classes`, editing hits `/api/classes/{id}/update`, and deleting goes through `/api/classes/{id}/delete`, with inline alerts for success/errors.
- The grid shows class name, school name, and section, with edit/delete actions preloading the drawer or calling the delete endpoint.

## Exam CRUD Experience
- `/api/exams` is surfaced by `src/pages/exams/ExamList.jsx`, which displays exam name, subject, type, class information, date, total marks, and question count.
- The drawer submits `name`, `subject`, `type` (0=MCQ, 1=Detailed), `school`, `class`, `totalMarks`, `questionCount`, and `examDate` to `/api/exams`, `/api/exams/{id}/update`, and `/api/exams/{id}/delete`. The school dropdown drives the class dropdown so only matching classes appear.
- Each exam row now includes buttons to generate sheets via the API: MCQ exams hit `/api/question-sheets/generate-question-sheet/{examId}`, detailed exams hit `/api/question-sheets/generate-detail-question-sheet/{examId}`, and answer sheets use `/api/question-sheets/generate-answer-sheet/{examId}`.

## Question CRUD Experience
- `/api/questions` is managed by `src/pages/questions/QuestionList.jsx`. Questions are filtered by exam (`GET /api/questions/by-exam/{examId}`) and saved via `/api/questions` or `/api/questions/{id}/update`. Deletions hit `/api/questions/{id}/delete`.
- Question types:
  - `type=0` (MCQ): captures option key/text pairs and a `correctOption`.
  - `type=1` (Detailed): captures `marks` and `lines`; no options/correct answer.
  - `type=2` (Diagram): captures `marks` and `boxSize` (1=half page, 2=full page); no options/correct answer.
- The drawer adapts fields per type and still accepts legacy `optionA`-`optionD`; MCQ saves a structured `options` array.

## Exam Sheets & Scoring
- Exam list (`src/pages/exams/ExamList.jsx`) includes header buttons to download static sheet templates (`src/images/sheet_questions.png`, `src/images/sheet_answer.png`), per-exam buttons to generate question/answer sheets via the API (MCQ vs detailed endpoints), and a per-exam action to calculate scores.
- **Calculate Score** opens a modal with a student dropdown (students loaded via `GET /api/students`) and a file upload. Submission posts multipart form data to `POST /api/question-sheets/{examId}/calculate-score` with fields `studentId` and `answerSheet` (binary file).
- Score responses render in a friendly summary table (exam, student, totals, correct/wrong, note) plus a per-question breakdown with clear Correct/Wrong badges—no raw JSON shown.

## School & Student CRUD
- `/schools` (`src/pages/schools/SchoolList.jsx`) uses POST-based create/update/delete calls to `/api/schools`, `/api/schools/{id}/update`, and `/api/schools/{id}/delete`, with name/code/address inputs and the same drawer experience.
- `/students` (`src/pages/students/StudentList.jsx`) orchestrates student number, name, username, password, school, and class. Student creation hits `/api/students`, updates go to `/api/students/{id}/update`, and deletes call `/api/students/{id}/delete`. Username cannot be edited once set, and leaving the password blank keeps the existing value.

## Notes
- You can change `VITE_API_BASE` to point at a different backend (defaults to `https://examiner.ideageek.pk`).
- For production, swap the placeholder login form with your real identity provider, ensuring the token is persisted where `AuthContext` expects it.
- `scripts/apiSmoke.js` runs a quick envelope and question-type sanity check (login, list exams, load questions).
