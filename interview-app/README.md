# Interview App

Candidate-facing interview frontend. Built with React + Vite + Tailwind CSS.

## Setup

```bash
cd interview-app
npm install
cp .env.example .env
```

## Environment Variables

Only one variable matters:

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000/api/v1` |

If you don't create a `.env` file at all, it falls back to `localhost:4000` automatically.

## Running Locally

Start the backend first (from the repo root):

```bash
cd backend
npm install
npm run dev
# runs on localhost:4000
```

Then in a separate terminal:

```bash
cd interview-app
npm run dev
# runs on localhost:5173
```

Open `localhost:5173?token=<interview-token>` in Chrome. You need a valid interview token from the backend to test the full flow.

> **Note:** Speech recognition requires Chrome or Chromium-based browsers.

## Using a Remote Backend

If you want to skip running the backend locally, point to the deployed one:

```
VITE_API_URL=https://hireai-production.up.railway.app/api/v1
```

Replace the URL with whatever Railway (or other) instance you're using.

## Deploy

Vite bakes env variables into the bundle at build time — they're not read at runtime. So `VITE_API_URL` must be set before running `npm run build`, either in `.env` or as a platform env variable.

### Cloudflare Pages

```bash
cd interview-app
npm run build
npx wrangler pages deploy dist --project-name=hireai --branch=main --commit-dirty=true
```

Set `VITE_API_URL` in the Cloudflare Pages dashboard under **Settings > Environment Variables**.

### Railway (Static Site)

1. Create a new service in Railway, point it to the repo
2. Set root directory to `interview-app`
3. Set build command: `npm run build`
4. Set start command: `npx serve dist -s` (or use Railway's static site option)
5. Add `VITE_API_URL` as an env variable in Railway's service settings

If both backend and frontend are on Railway, use the backend's internal or public Railway URL as `VITE_API_URL`.

## Backend Environment Variables

The backend needs these additional variables for email features (help requests, application confirmations):

| Variable | Description | Example |
|---|---|---|
| `RESEND_API_KEY` | API key from [Resend](https://resend.com) | `re_xxxxxxxx` |
| `RESEND_FROM_EMAIL` | Verified sender address in Resend | `hireai@yourdomain.com` |

Without these, the app still works — email features are skipped with a console warning.

For Railway: go to your backend service → **Variables** tab → add both.

For local dev: add them to `backend/.env`.

### Supabase Columns

The interviews table needs these columns for feedback and help features to work:

- `feedback_rating` (integer, nullable) — candidate star rating after interview
- `feedback_comment` (text, nullable) — optional text feedback from candidate

Add them via Supabase dashboard SQL Editor if not already present.

## Project Structure

```
src/
  App.tsx              — main app, screen routing, state management
  lib/api.ts           — all backend API calls
  types.ts             — TypeScript interfaces
  components/          — shared UI components (stepper, theme toggle, etc.)
  components/screens/  — each screen in the interview flow
  contexts/            — theme context provider
  hooks/               — speech recognition, timer, countdown hooks
```
