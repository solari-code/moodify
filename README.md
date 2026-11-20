# moodify

A calm mood and habit tracker built with Next.js 16 and React 19. Each day you check in with yourself: pick how the day felt on a scale from 0 to 10 and tick off the habits you did. Over time, a mood chart and a habit heatmap show your patterns.

## Features

- **Check-in:** an emoji scale for the mood (0–10, one color per step) and the habit list for the selected day, with a progress ring and each habit's streak. The mood is required, habits are optional. One entry per day: saving a day again overwrites its entry, and an entry can be deleted completely. With unsaved changes, switching days, leaving the dashboard (links inside the app, signing out) or reloading and closing the tab asks first. The browser's back and forward buttons don't ask.
- **Date navigation:** a week strip (Monday to Sunday) with each logged day's mood as a colored dot, and a calendar to jump to any past day.
- **Habits:** add your own habits (or pick a suggestion) and remove the ones you dropped. Past entries keep removed habits, so their history stays intact.
- **Overview:** average mood and the share of habits done (on logged days) for the last 7 or 30 days, the year or in total, plus each habit's streak and completion.
- **Mood chart:** daily mood and its 7-day average for the last 7, 30 or 90 days or the year. Days without an entry are gaps, not zeros. Click a day to open it.
- **Habit heatmap:** the last 53 weeks, GitHub style: the more habits done on a day, the stronger its square's color (relative to the busiest day). Can be filtered to one habit; click a day to open it.
- **Profile settings:** a settings page in the dashboard (`/dashboard/settings`, opened from the user menu) with the name Moodify uses for you, the color theme, the color mode and the app language (see [Profile settings](#profile-settings)).
- **Themes and dark mode:** the dashboard comes in four color themes (Sage, Ocean, Dusk, Clay), each in light and dark, or following the device's setting (the default); see [Appearance](#appearance). The landing page always keeps its light sage look.
- **Languages:** English, German and Spanish, including dates and numbers. The language follows the browser on the first visit and can be changed in the navigation on the landing page, or in the profile settings in the dashboard (see [Languages](#languages)).
- **Sign-in:** GitHub login via Auth.js (NextAuth v5); entries, habits and the name from the profile settings are stored per user in MongoDB.
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
- **Storage:** habits, entries and the name set in the profile settings are saved in `.data/moodify.json` (ignored by git). Delete the file to start over.
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

## Profile settings

`/dashboard/settings` (user menu → "Profile settings", also in the mobile menu) has three parts:

- **Profile:** the name Moodify uses for you, in the greeting ("Good morning, Ada": the first word), the user menu, the mobile menu and the avatar's initial. Empty means: use your account's name (GitHub, or "Demo User" in local mode), shown as the field's placeholder. Saving an empty field brings the account's name back.
- **Appearance:** color theme and color mode of the dashboard (see [Appearance](#appearance)).
- **Language:** the app language (see [Languages](#languages)). In the dashboard the language is set here; the landing page keeps its switcher in the navigation.

The name:

- is up to 50 characters after trimming (empty: the account's name is used); whitespace (also pasted line breaks) is collapsed to single spaces, other control characters are rejected. The server checks it again (`normalizeDisplayName` in `src/lib/validation.js`, action `updateDisplayName` in `src/app/actions/profile.js`) and returns an error code for the translated message.
- is stored in Moodify's own storage, not in the account: in MongoDB in the `profiles` collection (see [How data is stored](#how-data-is-stored)), in local mode in `.data/moodify.json`. The account's name stays untouched, so it's there again when the field is emptied.
- is shown to you only (Moodify has no shared or public pages).

In code, everything that shows the user uses `getCurrentUser()` (`src/lib/currentUser.js`): the signed-in user with `name` (the name to show), `displayName` (set in the settings, or null) and `accountName`. It's cached per request; `requireUser()` returns the same object.

## Appearance

The dashboard's look is set in the profile settings (`/dashboard/settings`, "Appearance"): a color theme and a color mode. Both can be combined freely.

| Theme | Look |
| --- | --- |
| Sage (default) | calm green, the landing page's look |
| Ocean | cool blue and teal |
| Dusk | soft violet |
| Clay | warm terracotta (errors in crimson, so they don't look like the theme color) |

| Color mode | Dashboard |
| --- | --- |
| Light | always light |
| Dark | always dark |
| System (default) | follows the device's light/dark setting, also when it changes while the page is open |

- **Saved per browser:** the choices are stored in the cookies `moodify-theme` and `moodify-color-mode` (kept for a year), like the language. They survive reloads and sign-outs; another device keeps its own choices, and everyone signing in with the same browser shares them.
- **Dashboard only:** theme and mode apply to `/dashboard` and its sub-pages, including the navigation, the footer and everything that opens on top (dialogs, menus). The landing page always keeps its light sage look and has no theme or mode switch.
- **No flicker:** they're applied on `<html>` (`data-theme="<theme>"` and the `dark` class) before the page is first painted. An inline script in the root layout's `<head>` does this on every full page load (reading the cookies and, for "System", the device's setting); while the app runs, the dashboard layout keeps them up to date and removes them when you go to the landing page (`DashboardAppearance`). The settings page is rendered on the server with the saved choices, so it doesn't jump either.
- **Previews:** each theme option in the settings shows a few of its colors in the current mode. The theme selectors in `globals.css` work on any element, so a preview only needs `data-theme="<theme>"`.

In code: the themes, modes, cookies and the inline script are in `src/lib/appearance.js` (`applyAppearance` is shared by the inline script and the app, so both always agree); the browser side is in `src/components/appearance/`, the settings' choices in `src/components/settings/`. The colors are in `src/app/globals.css` (see [Design](#design)).

### Adding a theme

1. Add its name to `THEMES` in `src/lib/appearance.js`.
2. Add a light and a dark palette to `src/app/globals.css`, next to the others: `[data-theme="<name>"] { … }` and `.dark[data-theme="<name>"], .dark [data-theme="<name>"] { … }`. Set the surfaces, text, primary, secondary, muted, accent, border, input, ring, shadow, `--mood-line`, `--control` and `--heatmap-0` … `--heatmap-4`; the dark palette needs every color the light one sets. Mood colors and the lavender/peach accents come from sage unless the theme sets its own.
3. Add its name and a short hint to `settings.appearance.themes` in every file in `src/i18n/messages/`.
4. Run `npm test`: it checks that the theme has both palettes and that all colors reach their contrast (see [Design](#design)).

## Languages

Moodify is available in English, German and Spanish. All texts come from the translation files; only the user's own content (habit names, the demo data of local mode, the user's name) is shown as entered.

### Which language is shown

On every request the server picks the language:

1. the language the user chose (cookie `moodify-locale`, kept for a year): in the navigation on the landing page, or in the profile settings in the dashboard (the dashboard's navigation has no language switcher)
2. otherwise the first supported language in the browser's language list (`Accept-Language`): "fr, de" gives German, "de-AT" gives German
3. otherwise English

Without a choice, the language keeps following the browser. Switching the language renders the page again on the server; nothing on the page is reset (e.g. a name typed but not yet saved in the profile settings stays).

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
| `MONGODB_URI` | entries, habits, profiles and sessions (normal mode) |
| `AUTH_SECRET` | signing the session (Auth.js); optional in local mode |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub sign-in |
| `MOODIFY_LOCAL_MODE` | `true` forces local mode, required for local mode in production |

## How data is stored

- Every entry belongs to one calendar day, identified by a `YYYY-MM-DD` key. The key is created in the browser from the day the user picked, so the server's timezone never moves an entry to another day.
- There is at most one entry per user and day. In MongoDB, a unique index on `{ userId, date }` in the `entries` collection enforces this; in local mode, entries are stored by day.
- An entry stores the mood (0–10) and the names of the habits that were done. The server validates all input and rejects days in the future.
- The name from the profile settings is stored per user: in MongoDB in the `profiles` collection (`{ userId, displayName, createdAt, updatedAt }`, at most one per user, enforced by a unique index on `userId`; emptying the name removes `displayName`), in local mode under the user's `profile` in `.data/moodify.json`. Accounts themselves (and their names) are Auth.js' `users` collection and aren't changed.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | development server (Turbopack) |
| `npm run build` | production build |
| `npm start` | run the production build |
| `npm run lint` | ESLint |
| `npm test` | unit tests and the contrast check of the color palettes (Node's built-in test runner) |

## Project structure

- `src/app/`: pages (`/`, `/dashboard` and `/dashboard/settings`, 404 and error pages), server actions in `actions/`, the Auth.js route in `api/auth/`
- `src/components/dashboard/`: header and week strip, calendar, check-in (mood picker, habit rows, save bar), habit dialog, overview, mood chart, habit heatmap and the local-mode demo data bar
- `src/components/landing/`: the landing page's check-in preview and sample insights (built from the dashboard components)
- `src/components/nav/`: navigation, user menu, language switcher, sign-in and sign-out, footer
- `src/components/settings/`: the parts of the profile settings page (name form, theme and color mode choices)
- `src/components/appearance/`: applies theme and color mode in the browser (see [Appearance](#appearance))
- `src/components/LeaveGuard.jsx`: asks before links or signing out drop unsaved changes. Links inside the app use its `GuardedLink` (or `NavLink`, which is built on it), actions that leave the page go through `useLeaveGuard().requestLeave`
- `src/components/brand/`: the Moodify logo (lotus mark and wordmark)
- `src/components/ui/`: UI components (shadcn/ui, Radix; charts with Recharts)
- `src/i18n/`: languages and their selection, translation files (`messages/`), message formatting, date and number formatting (see [Languages](#languages))
- `src/lib/`: mode detection, the signed-in user (`currentUser.js`, `requireUser.js`), day keys, validation, statistics, demo data, routes, appearance (themes, color mode), MongoDB client
- `src/lib/store/`: storage backends with the same functions: MongoDB (normal mode) and JSON file (local mode)
- `src/hooks/`: React hooks
- `tests/`: unit tests; `contrast.test.mjs` checks the color palettes (helpers in `tests/support/`)
- `auth.js`: Auth.js setup (GitHub + MongoDB, or the demo login in local mode)

## Design

- **Themes:** colors are CSS variables in `src/app/globals.css`, available as Tailwind colors (`tailwind.config.js`). Sage is the base: a light palette (`:root`, also the landing page) and a dark one (`.dark`); Ocean, Dusk and Clay each override it with their own light and dark palette (`[data-theme="…"]`, see [Appearance](#appearance)). Use the color tokens (`bg-card`, `text-muted-foreground`, …) instead of fixed colors, so everything works in every theme and mode. In sage, sage green is the primary color; lavender and peach are accents in all themes.
- **Mood colors:** `--mood-0` … `--mood-10`, from muted blue over sand to sage (no red: a low day isn't a failure). Use `bg-mood-N` for fixed values or `moodColor(mood)` from `src/lib/mood.js` for computed ones.
- **Charts and heatmap:** the mood chart's daily line is `--mood-line`, its 7-day average `--primary`. The heatmap's levels are `--heatmap-1` … `--heatmap-4` (`bg-heatmap-N`), the outline of "logged, no habits done" is `--heatmap-0`.
- **Contrast:** every palette meets WCAG AA, checked by `npm test` (`tests/contrast.test.mjs`, for every theme in light and dark):

  | What | Minimum |
  | --- | --- |
  | text, on every surface it's shown on (also hovered buttons) | 4.5:1 |
  | mood colors (dots, bars, chart points), chart lines, heatmap levels | 3:1 against the surfaces they're on |
  | focus ring; border of checkboxes and text fields (`--control`, their only visible shape) | 3:1 |
  | text of things that can't be used right now (disabled buttons, future days) | 3:1 (WCAG requires none, but it must stay readable) |

  The test mixes colors with opacity as they appear on screen. So: prefer color tokens over opacity for text (faded text quickly drops below 4.5:1), give disabled buttons the muted colors (the button component does this), and add new color combinations to the test's list.
- **Fonts:** Figtree for text, Fraunces (with its "soft" axis) for headings, both bundled in `src/app/fonts`. Emojis use the `font-emoji` stack, so color emoji fonts win over black-and-white system glyphs.
- **Logo:** `src/components/brand/Logo.jsx` uses the theme colors, so in the dashboard it follows the chosen theme and mode. The favicon `src/app/icon.svg` is a copy with fixed colors; `favicon.ico` and `apple-icon.png` are rendered from it. Update them together.

## License

MIT, see [LICENSE](LICENSE). The bundled fonts Figtree and Fraunces (`src/app/fonts`) are under the SIL Open Font License (license texts included there).
