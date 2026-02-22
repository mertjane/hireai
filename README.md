# HireAI

An AI-powered hiring platform that streamlines the recruitment process — from job posting and candidate management to interview scheduling and question assignment.

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Node.js, Express 5, Supabase, Firebase  |
| Frontend | Vanilla JavaScript (in progress)        |
| Auth     | Firebase Authentication + Admin SDK     |
| Database | Supabase (PostgreSQL)                   |
| Docs     | Swagger UI (`/api-docs`)                |

## Project Structure

```
hireai-app/
├── backend/               # Node.js/Express REST API
│   ├── config/            # DB, Firebase, Swagger config
│   ├── constants/         # Status codes and error constants
│   ├── middlewares/       # Auth middleware (Firebase token verification)
│   ├── modules/
│   │   ├── auth/          # Register & Login
│   │   ├── jobs/          # Job postings CRUD
│   │   ├── candidates/    # Candidate applications
│   │   ├── interviews/    # Interview scheduling & token access
│   │   ├── questions/     # Interview question bank
│   │   └── interview-questions/  # Questions assigned to interviews
│   └── utils/             # Error handling utilities
└── frontend/              # Vanilla JS client (in progress)
```

## API Modules

| Module               | Base URL                          | Auth     |
|----------------------|-----------------------------------|----------|
| Auth                 | `/api/v1/auth`                    | Public   |
| Jobs                 | `/api/v1/jobs`                    | Bearer   |
| Candidates           | `/api/v1/candidates`              | Mixed    |
| Interviews           | `/api/v1/interviews`              | Mixed    |
| Questions            | `/api/v1/questions`               | Bearer   |
| Interview Questions  | `/api/v1/interview-questions`     | Mixed    |

> Full API documentation available at `/api-docs` when the server is running.

## Getting Started

```bash
cd backend
npm install
npm run dev     # starts on http://localhost:4000
```

Create a `.env` file in `backend/` based on the required variables:

```
PORT=4000
APP_URL=http://localhost:4000
SUPABASE_URL=
SUPABASE_ANON_KEY=
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_BUCKET=
FIREBASE_MSG_SENDER_ID=
FIREBASE_APP_ID=
```

## License

MIT
