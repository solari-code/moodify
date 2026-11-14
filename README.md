# moodify

A small mood and habit tracker built with Next.js 14. Each day you log how you feel on a slider and tick off the habits you did. The dashboard shows an overview and a calendar.

This is an early version: the core tracking works, but many features are still basic.

## Features

- **Day tracker:** mood slider and habit checklist for the selected day
- **Habits:** add your own habits
- **Overview and calendar:** pick a day and see its entry
- **Sign-in:** GitHub login via Auth.js (NextAuth v5); entries and habits are stored per user in MongoDB

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app needs a MongoDB database and a GitHub OAuth app; without `MONGODB_URI` it stops with an error at startup.

## Environment variables

See [`.env.example`](.env.example):

| Variable | Used for |
| --- | --- |
| `MONGODB_URI` | entries, habits and sessions |
| `AUTH_SECRET` | signing the session (Auth.js) |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub sign-in |

## Project structure

- `src/app/`: pages (`/` and `/dashboard`), server actions in `actions/`, the Auth.js route in `api/auth/`
- `src/components/dashboard/`: day tracker, overview and calendar
- `src/components/nav/`: navigation, user menu, sign-in button
- `src/components/ui/`: UI components (shadcn/ui, Radix)
- `src/lib/`: MongoDB client and helpers
- `auth.js`: Auth.js setup (GitHub provider, MongoDB adapter)

## License

MIT, see [LICENSE](LICENSE). The bundled Geist fonts (`src/app/fonts`) are under the SIL Open Font License.
