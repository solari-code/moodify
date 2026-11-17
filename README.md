# moodify

A calm mood and habit tracker built with Next.js 16 and React 19. Each day you check in with yourself: pick how the day felt on a scale from 0 to 10 and tick off the habits you did. Over time, a mood chart and a habit heatmap show your patterns.

## Features

- **Check-in:** an emoji scale for the mood (0–10, one color per step) and the habit list for the selected day, with a progress ring and each habit's streak. The mood is required, habits are optional. One entry per day: saving a day again overwrites its entry, and an entry can be deleted completely. Switching days or closing the tab with unsaved changes asks first.
- **Date navigation:** a week strip (Monday to Sunday) with each logged day's mood as a colored dot, and a calendar to jump to any past day.
- **Habits:** add your own habits (or pick a suggestion) and remove the ones you dropped. Past entries keep removed habits, so their history stays intact.
- **Overview:** average mood and the share of habits done (on logged days) for the last 7 or 30 days, the year or in total, plus each habit's streak and completion.
- **Mood chart:** daily mood and its 7-day average for the last 7, 30 or 90 days or the year. Days without an entry are gaps, not zeros. Click a day to open it.
- **Habit heatmap:** the last 53 weeks, GitHub style: the more habits done on a day, the darker its square (relative to the busiest day). Can be filtered to one habit; click a day to open it.
- **Languages:** English, German and Spanish, including dates and numbers. The language follows the browser on the first visit and can be changed in the navigation (see [Languages](#languages)).
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

## Languages

Moodify is available in English, German and Spanish. All texts come from the translation files; only the user's own content (habit names, the demo data of local mode, the user's name) is shown as entered.

### Which language is shown

On every request the server picks the language:

1. the language the user chose in the switcher (cookie `moodify-locale`, kept for a year)
2. otherwise the first supported language in the browser's language list (`Accept-Language`): "fr, de" gives German, "de-AT" gives German
3. otherwise English

Without a choice, the language keeps following the browser. Switching the language renders the page again on the server; nothing on the page is reset (an unsaved check-in stays).

Dates, weekdays and numbers follow the app language, not the browser's (US format for English: "Sunday, November 15, 2026"; "Sonntag, 15. November 2026"; "6,5"; "42 %"). The time zone stays the browser's, so days stay correct. Weeks start on Monday in every language.

Auth.js' own pages (sign-in, sign-out, error) exist only in English, so they are never shown: every Auth.js page and failed Auth.js request leads to the landing page instead (`pages` in `auth.js`, `src/app/api/auth/[...nextauth]/route.js`). If a sign-in failed (e.g. canceled on GitHub), Auth.js adds `?error=<type>` and the landing page shows a translated notice for it (`src/lib/authErrors.js` picks the message). The 404 and error pages are Moodify's own and translated too.

### Translation files

Each language has one file in `src/i18n/messages/` (`en.json`, `de.json`, `es.json`), grouped by area (`landing`, `dashboard`, `errors`, …). Texts use a small part of the ICU message syntax:

| Syntax | Example |
| --- | --- |
| value | `"Looking back at {date}."` |
| plural (`#` is the number) | `"{count, plural, one {# day} other {# days}}"` |
| exact number | `"{count, plural, =0 {No entries} one {# entry} other {# entries}}"` |
| tag for formatting | `"Remove <b>{name}</b>?"` |

Numbers in values are formatted for the language automatically. Plurals need the forms of the language (German and Spanish: `one` and `other`; other languages have more, e.g. Polish `one`, `few`, `many`). Apostrophes need no escaping.

In code:

- client components: `const t = useTranslations("dashboard.header")` and `t("backToToday")`; `t.rich(key, { b: (chunks) => <strong>{chunks}</strong> })` for tags; `useFormatter()` for dates and numbers (`format.date(date, FULL_DATE)`, `format.decimal(6.5)`, `format.percent(0.42)`, `format.list(names)`)
- server components and metadata: `await getTranslations(…)` and `await getFormatter()` from `src/i18n/server.js`
- errors: server actions and validation return codes (`{ error: "habitExists" }`); the UI shows `errors.<code>` via `errorMessage(t, code)` (`src/i18n/errors.js`)

### Adding a language

1. Add it to `LANGUAGES` in `src/i18n/config.js`: its code, its name in its own language (shown in the switcher) and the locale for dates and numbers (e.g. `{ code: "fr", name: "Français", intlLocale: "fr-FR" }`).
2. Copy `src/i18n/messages/en.json` to `<code>.json` and translate every text.
3. Add the calendar's locale to `src/i18n/dayPickerLocales.js` (from `react-day-picker/locale`).
4. Run `npm test`: it checks that the new language is complete.

The bundled fonts cover Latin-1 (enough for English, German, Spanish, French, …). Languages with other letters (e.g. Polish, Czech, Turkish, Greek) need a larger font subset in `src/app/fonts/`.

### Checks

- `npm test` checks that every language has exactly the keys of English, no empty texts, valid syntax, the same values and tags as English, all plural forms the language needs, a label for every mood, period and chart range, a calendar locale, and a message for every error code in the code.
- `npm run lint` fails on hardcoded UI text in JSX (between tags and in `aria-label`, `title`, `placeholder`, …) and on `Intl` formatters or `toLocale…String()` outside `src/i18n/` (they would use the browser's language). Texts built in plain JavaScript can't be detected: they have to use `t()` as well.

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

- `src/app/`: pages (`/` and `/dashboard`, 404 and error pages), server actions in `actions/`, the Auth.js route in `api/auth/`
- `src/components/dashboard/`: header and week strip, calendar, check-in (mood picker, habit rows, save bar), habit dialog, overview, mood chart, habit heatmap and the local-mode demo data bar
- `src/components/landing/`: the landing page's check-in preview and sample insights (built from the dashboard components)
- `src/components/nav/`: navigation, user menu, language switcher, sign-in and sign-out, footer
- `src/components/brand/`: the Moodify logo (lotus mark and wordmark)
- `src/components/ui/`: UI components (shadcn/ui, Radix; charts with Recharts)
- `src/i18n/`: languages and their selection, translation files (`messages/`), message formatting, date and number formatting (see [Languages](#languages))
- `src/lib/`: mode detection, day keys, validation, statistics, demo data, MongoDB client
- `src/lib/store/`: storage backends with the same functions: MongoDB (normal mode) and JSON file (local mode)
- `src/hooks/`: React hooks
- `tests/`: unit tests
- `auth.js`: Auth.js setup (GitHub + MongoDB, or the demo login in local mode)

## Design

- **Theme:** colors are CSS variables in `src/app/globals.css` (light and dark palette; there is no dark mode toggle yet) and are available as Tailwind colors (`tailwind.config.js`). Sage green is the primary color, lavender and peach are accents.
- **Mood colors:** `--mood-0` … `--mood-10`, from muted blue over sand to sage (no red: a low day isn't a failure). Use `bg-mood-N` for fixed values or `moodColor(mood)` from `src/lib/mood.js` for computed ones.
- **Fonts:** Figtree for text, Fraunces (with its "soft" axis) for headings, both bundled in `src/app/fonts`. Emojis use the `font-emoji` stack, so color emoji fonts win over black-and-white system glyphs.
- **Logo:** `src/components/brand/Logo.jsx` uses the theme colors. The favicon `src/app/icon.svg` is a copy with fixed colors; `favicon.ico` and `apple-icon.png` are rendered from it. Update them together.

## License

MIT, see [LICENSE](LICENSE). The bundled fonts Figtree and Fraunces (`src/app/fonts`) are under the SIL Open Font License (license texts included there).
