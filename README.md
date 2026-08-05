# Job Whisperer

Job Whisperer is a job application tracker that helps you manage your job search efficiently.

## Features

- **Job Tracking:** Keep track of all your job applications in one place.
- **Status Management:** Update the status of your applications (Saved, Applied, Interviewing, Offered, etc.).
- **Notes & Documents:** Add notes and upload documents related to each job application.
- **Analytics:** Visualize your job search progress with insights and charts.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd job-whisperer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    ```bash
    cp .env.example .env
    ```
    Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from your
    Supabase project's **Settings → API** page. Never commit `.env`.

4.  **Set up the Supabase project** (database, auth, storage only — no Edge Functions):
    - Run the SQL migrations in `supabase/migrations/` against your project,
      in filename order (via the Supabase SQL editor, or the Supabase CLI:
      `supabase db push`).
    - Under **Storage**, confirm a private `job-documents` bucket exists (the
      migrations create it) with a 5 MB size limit and PDF/DOC/DOCX MIME
      types allowed.
    - Under **Authentication → URL Configuration**, add your app's origin(s)
      (e.g. `http://localhost:8080` for local dev, and your production
      domain) to the **Redirect URLs** allowlist — required for the
      email-confirmation link in Signup to redirect back correctly.
    - Under **Settings → API**, copy the **service_role** key — you'll need
      it for `SUPABASE_SERVICE_ROLE_KEY` below. Keep it secret; it bypasses
      Row Level Security entirely.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  **Open your browser:**
    Navigate to `http://localhost:8080` (or the port shown in your terminal).

## Deployment (Vercel)

This app is built to deploy entirely on Vercel — the frontend as a static
build, and the two server-side pieces (`/api/extract-job`, `/api/delete-account`)
as Vercel Edge Functions. No separate Supabase Edge Function deployment is
needed; Supabase is used purely for the database, Auth, and Storage.

In your Vercel project's **Settings → Environment Variables**, set:

| Variable | Value | Exposed to browser? |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes (required for the frontend) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/publishable key | Yes (safe — RLS protects the data) |
| `GROQ_API_KEY` | A key from [console.groq.com](https://console.groq.com) | **No** — server-only |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key | **No** — server-only, bypasses RLS |

Only variables prefixed `VITE_` get bundled into the browser build; the other
two are read via `process.env` inside the `/api` functions and never reach
the client. Vercel auto-detects and deploys anything under `/api` — no extra
configuration needed beyond setting these variables and pushing.

If `GROQ_API_KEY` isn't set, "Fill with Groq AI" in Add Job fails gracefully
(a toast asking for manual entry) — everything else in the app is unaffected.

Before shipping changes, run the full release gate locally:
```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

## Technologies Used

- React
- TypeScript
- Vite
- Supabase
- Tailwind CSS
- Shadcn UI
