# moodify

A small mood and habit tracker built with Next.js 16 and React 19. Each day you log how you feel on a slider and tick off the habits you did. The dashboard shows a calendar, your daily entry and an overview with average mood and habit streaks.

This is an early version: the core tracking works, but many features are still basic.

## Features

- **Day tracker:** mood slider (0–10) and habit checklist for the selected day. One entry per day: saving a day again overwrites its entry, and an entry can be deleted completely.
- **Calendar:** pick today or any past day to see, fill in or change its entry. Days with an entry are marked with a dot.
- **Habits:** add your own habits and remove the ones you dropped. Past entries keep removed habits, so their history stays intact.
- **Overview:** average mood for the last 7, 30 or 365 days or in total, and a streak for each habit.
- **Sign-in:** GitHub login via Auth.js (NextAuth v5); entries and habits are stored per user in MongoDB.
- **Local mode:** runs without any setup, with a demo login and local file storage, for development and testing.

## Getting started

The quickest way is local mode, which needs no `.env` file, database or GitHub app:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Continue as demo user**.

To use GitHub login and MongoDB instead, create `.env.local` before starting:

```bash
cp .env.example .env.local   # then fill in your values
npm run dev
```

## Local mode

Local mode replaces GitHub login and MongoDB, so the app can be developed and tested without accounts or credentials.

- **Demo login:** the sign-in buttons log you in as "Demo User", no password needed. A "Local mode" badge is shown in the navigation.
- **Storage:** habits and entries are saved in `.data/moodify.json` (ignored by git). Delete the file to start over.
- **Demo data:** the dashboard has a **Load demo data** button that replaces your local habits and entries with about four months of sample data. Today is left empty, so you can try logging right away. This only works in local mode; the server refuses it otherwise.

When local mode is active:

| Situation | Mode |
| --- | --- |
| `MOODIFY_LOCAL_MODE=true` | local mode (also in production) |
| `MONGODB_URI` is set | normal mode (GitHub + MongoDB) |
| neither set, `npm run dev` | local mode (automatic) |
| neither set, `npm start` (production) | error: local mode must be enabled explicitly |

`npm run build` works without any environment variables. To run a production build in local mode:

```bash
npm run build
MOODIFY_LOCAL_MODE=true npm start
```

Local mode is meant for a single local server process. Don't use it for a deployed app with real users.

## Environment variables

See [`.env.example`](.env.example). None of them are needed for local mode.

| Variable | Used for |
| --- | --- |
| `MONGODB_URI` | entries, habits and sessions (normal mode) |
| `AUTH_SECRET` | signing the session (Auth.js); optional in local mode |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub sign-in |
| `MOODIFY_LOCAL_MODE` | `true` forces local mode, required for local mode in production |

## How entries are stored

- Every entry belongs to one calendar day, identified by a `YYYY-MM-DD` key. The key is created in the browser from the day the user picked, so the server's timezone never moves an entry to another day.
- There is at most one entry per user and day. In MongoDB, a unique index on `{ userId, date }` in the `entries` collection enforces this; in local mode, entries are stored by day.
- An entry stores the mood (0–10) and the names of the habits that were done. The server validates all input and rejects days in the future.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | development server (Turbopack) |
| `npm run build` | production build |
| `npm start` | run the production build |
| `npm run lint` | ESLint |
| `npm test` | unit tests (Node's built-in test runner) |

## Project structure

- `src/app/`: pages (`/` and `/dashboard`), server actions in `actions/`, the Auth.js route in `api/auth/`
- `src/components/dashboard/`: calendar, day tracker, overview and the local-mode demo data bar
- `src/components/nav/`: navigation, user menu, sign-in and sign-out
- `src/components/ui/`: UI components (shadcn/ui, Radix)
- `src/lib/`: mode detection, day keys, validation, statistics, demo data, MongoDB client
- `src/lib/store/`: storage backends with the same functions: MongoDB (normal mode) and JSON file (local mode)
- `src/hooks/`: React hooks
- `tests/`: unit tests
- `auth.js`: Auth.js setup (GitHub + MongoDB, or the demo login in local mode)

## License

MIT, see [LICENSE](LICENSE). The bundled Geist fonts (`src/app/fonts`) are under the SIL Open Font License.
