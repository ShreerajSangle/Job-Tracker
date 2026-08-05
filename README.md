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

4.  **Set up the Supabase project:**
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
    - Deploy the account-deletion Edge Function:
      `supabase functions deploy delete-account`. It runs with the
      project's service-role key (available to Edge Functions automatically)
      to remove Storage objects and the Auth user server-side.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  **Open your browser:**
    Navigate to `http://localhost:8080` (or the port shown in your terminal).

## Deployment

- `npm run build` outputs a static bundle in `dist/`, deployable to any
  static host. `vercel.json` is included for Vercel (SPA rewrites + security
  headers).
- Set the same environment variables from step 3 in your hosting provider's
  dashboard before building for production.
- Before shipping changes, run the full release gate locally:
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
