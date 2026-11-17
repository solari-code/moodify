import { de, enUS, es } from "react-day-picker/locale"

// The calendar's (react-day-picker) locale for each app language: month
// names, weekday names and its screen reader labels. Kept apart from
// config.js, so only the calendar loads these.
//
// When adding a language, add its locale here too (`npm test` checks this).
export const DAY_PICKER_LOCALES = {
    en: enUS,
    de,
    es,
}
