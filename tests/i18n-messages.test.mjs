import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { DEFAULT_LOCALE, LANGUAGES } from "../src/i18n/config.js"
import { messageSignature, parseMessage, pluralCategories } from "../src/i18n/messageFormat.js"
import { DEMO_HABITS, DEMO_HABIT_KEYS } from "../src/lib/demoData.js"
import { DAY_PICKER_LOCALES } from "../src/i18n/dayPickerLocales.js"
import { MOOD_MIN, MOOD_MAX } from "../src/lib/validation.js"
import { MOOD_PERIODS, MOOD_CHART_RANGES } from "../src/lib/stats.js"
import { AUTH_ERROR_KEYS } from "../src/lib/authErrors.js"

// Every language must be complete: the same keys as the default language
// (English), no empty texts, valid message syntax, the same placeholders and
// tags, and plural forms for every case the language needs.

const MESSAGES_DIR = new URL("../src/i18n/messages/", import.meta.url)

function loadMessages(code) {
    return JSON.parse(readFileSync(new URL(`${code}.json`, MESSAGES_DIR), "utf8"))
}

// { "nav.signIn": "Sign in", … } (non-string leaves are kept, to be reported)
function flatten(messages, prefix = "") {
    return Object.entries(messages).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key
        return value !== null && typeof value === "object" && !Array.isArray(value)
            ? Object.entries(flatten(value, path))
            : [[path, value]]
    }).reduce((all, [key, value]) => ({ ...all, [key]: value }), {})
}

// Plural categories a language uses for whole numbers (e.g. Polish: one, few, many).
function requiredPluralCategories(intlLocale) {
    const rules = new Intl.PluralRules(intlLocale)
    const categories = new Set()
    for (let n = 0; n < 10000; n++) categories.add(rules.select(n))
    return [...categories]
}

// All .js/.jsx files below a directory.
function sourceFiles(dir) {
    return readdirSync(dir, { recursive: true })
        .filter((file) => /\.jsx?$/.test(file))
        .map((file) => new URL(file, dir))
}

const reference = flatten(loadMessages(DEFAULT_LOCALE))

describe("message files", () => {
    test("there is one file per configured language, and no other", () => {
        const files = readdirSync(MESSAGES_DIR).filter((file) => file.endsWith(".json")).sort()
        const expected = LANGUAGES.map(({ code }) => `${code}.json`).sort()
        assert.deepEqual(files, expected)
    })

    test("the default language has messages", () => {
        assert.ok(Object.keys(reference).length > 0)
    })

    test("every mood has a label", () => {
        const moods = Array.from({ length: MOOD_MAX - MOOD_MIN + 1 }, (_, index) => MOOD_MIN + index)
        assert.deepEqual(moods.filter((mood) => !(`moodLabels.${mood}` in reference)), [])
    })

    test("every overview period and chart range has a short and a long name", () => {
        const keys = [
            ...Object.keys(MOOD_PERIODS).map((key) => `dashboard.overview.periods.${key}`),
            ...Object.keys(MOOD_CHART_RANGES).map((key) => `dashboard.moodChart.ranges.${key}`),
        ].flatMap((key) => [`${key}.short`, `${key}.long`])
        assert.deepEqual(keys.filter((key) => !(key in reference)), [])
    })

    // The long name is what screen readers hear; it has to contain the visible
    // short name, so voice control users can say what they see.
    test("long period and range names contain the short ones", () => {
        const problems = LANGUAGES.flatMap(({ code }) => {
            const messages = flatten(loadMessages(code))
            return Object.keys(messages)
                .filter((key) => /^dashboard\.(overview\.periods|moodChart\.ranges)\.\w+\.short$/.test(key))
                .filter((key) => !messages[key.replace(/short$/, "long")].toLowerCase().includes(messages[key].toLowerCase()))
                .map((key) => `${code}: ${key}`)
        })
        assert.deepEqual(problems, [])
    })

    test("every sign-in error has a message", () => {
        assert.deepEqual(AUTH_ERROR_KEYS.filter((key) => !(`authErrors.${key}` in reference)), [])
    })

    test("every language has a calendar locale", () => {
        assert.deepEqual(Object.keys(DAY_PICKER_LOCALES).sort(), LANGUAGES.map(({ code }) => code).sort())
    })

    // Errors are kept as codes ({ error: "code" } from the server actions and
    // validation, setError("code") in components); the UI shows errors.<code>.
    test("every error code has a message", () => {
        const codes = sourceFiles(new URL("../src/", import.meta.url))
            .flatMap((file) => [...readFileSync(file, "utf8").matchAll(/(?:error: |setError\()"(\w+)"/g)].map((match) => match[1]))
        assert.ok(codes.length > 10, `only ${codes.length} codes found`)
        assert.deepEqual([...new Set(codes)].filter((code) => !(`errors.${code}` in reference)), [])
    })

    // the landing page shows the (English) demo habits translated
    test("every demo habit has a translated sample name", () => {
        const missing = DEMO_HABITS.filter((name) => !(`sampleHabits.${DEMO_HABIT_KEYS[name]}` in reference))
        assert.deepEqual(missing, [])
    })
})

for (const { code, intlLocale } of LANGUAGES) {
    describe(`messages: ${code}`, () => {
        const messages = flatten(loadMessages(code))

        test("has exactly the keys of the default language", () => {
            const missing = Object.keys(reference).filter((key) => !(key in messages))
            const extra = Object.keys(messages).filter((key) => !(key in reference))
            assert.deepEqual({ missing, extra }, { missing: [], extra: [] })
        })

        test("all messages are non-empty texts", () => {
            const invalid = Object.entries(messages)
                .filter(([, value]) => typeof value !== "string" || value.trim() === "")
                .map(([key]) => key)
            assert.deepEqual(invalid, [])
        })

        test("all messages have valid syntax", () => {
            const errors = Object.entries(messages).flatMap(([key, value]) => {
                try {
                    parseMessage(value)
                    return []
                } catch (error) {
                    return [`${key}: ${error.message}`]
                }
            })
            assert.deepEqual(errors, [])
        })

        test("uses the same placeholders and tags as the default language", () => {
            const mismatches = Object.entries(messages)
                .filter(([key]) => key in reference)
                .filter(([key, value]) => {
                    try {
                        return JSON.stringify(messageSignature(value)) !== JSON.stringify(messageSignature(reference[key]))
                    } catch {
                        return false // reported by the syntax test
                    }
                })
                .map(([key]) => key)
            assert.deepEqual(mismatches, [])
        })

        test("plurals cover all forms of the language, and only those", () => {
            const required = requiredPluralCategories(intlLocale)
            const allowed = new Intl.PluralRules(intlLocale).resolvedOptions().pluralCategories
            const problems = Object.entries(messages).flatMap(([key, value]) => {
                let plurals
                try {
                    plurals = pluralCategories(value)
                } catch {
                    return [] // reported by the syntax test
                }
                return plurals.flatMap((used) => {
                    const missing = required.filter((category) => !used.includes(category))
                    const unknown = used.filter((category) => !allowed.includes(category))
                    return missing.length || unknown.length
                        ? [`${key}: missing [${missing}] unknown [${unknown}]`]
                        : []
                })
            })
            assert.deepEqual(problems, [])
        })
    })
}
