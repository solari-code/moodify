import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { formatMessage, formatMessageToParts, messageSignature, parseMessage, pluralCategories } from "../src/i18n/messageFormat.js"
import { createTranslator } from "../src/i18n/translator.js"
import { negotiateLocale, parseAcceptLanguage } from "../src/i18n/negotiate.js"
import { createFormatter } from "../src/i18n/formatter.js"
import { DEFAULT_LOCALE, LANGUAGES, LOCALES, getLanguage, isSupportedLocale } from "../src/i18n/config.js"

const en = { locale: "en-US" }
const de = { locale: "de-DE" }
const es = { locale: "es-ES" }

describe("formatMessage", () => {
    test("plain text and values", () => {
        assert.equal(formatMessage("Hello", {}, en), "Hello")
        assert.equal(formatMessage("Hello, {name}!", { name: "Ada" }, en), "Hello, Ada!")
        assert.equal(formatMessage("{ name }", { name: "Ada" }, en), "Ada")
    })

    test("numbers follow the locale", () => {
        assert.equal(formatMessage("{n}", { n: 1234.5 }, en), "1,234.5")
        assert.equal(formatMessage("{n}", { n: 1234.5 }, de), "1.234,5")
    })

    test("plurals use the locale's rules, exact matches first", () => {
        const message = "{count, plural, =0 {no days} one {# day} other {# days}}"
        assert.equal(formatMessage(message, { count: 0 }, en), "no days")
        assert.equal(formatMessage(message, { count: 1 }, en), "1 day")
        assert.equal(formatMessage(message, { count: 2 }, en), "2 days")
        assert.equal(formatMessage(message, { count: 1000 }, en), "1,000 days")
        assert.equal(formatMessage(message, { count: 1000 }, de), "1.000 days")
    })

    test("plurals inside a sentence, several in one message", () => {
        const message = "{name}: {count, plural, one {done once} other {done # times}}"
        assert.equal(formatMessage(message, { name: "Walk", count: 3 }, en), "Walk: done 3 times")
        const two = "{active, plural, one {# day} other {# days}} active, {logged, plural, one {# day} other {# days}} logged"
        assert.equal(formatMessage(two, { active: 1, logged: 30 }, en), "1 day active, 30 days logged")
    })

    test("# is plain text outside plurals", () => {
        assert.equal(formatMessage("#1 habit", {}, en), "#1 habit")
    })

    test("apostrophes are plain text (no ICU escaping)", () => {
        assert.equal(formatMessage("isn't", {}, en), "isn't")
        assert.equal(formatMessage("It's your day's mood", {}, en), "It's your day's mood")
    })

    test("tags: removed in plain text, rendered by functions in parts", () => {
        assert.equal(formatMessage("Remove <b>{name}</b>?", { name: "Walk" }, en), "Remove Walk?")
        assert.deepEqual(
            formatMessageToParts("Remove <b>{name}</b>?", { name: "Walk", b: (chunks) => ({ bold: chunks }) }, en),
            ["Remove ", { bold: ["Walk"] }, "?"]
        )
        assert.equal(formatMessage("1 < 2", {}, en), "1 < 2")
    })

    test("non-text values are passed through as parts", () => {
        const element = { element: true }
        assert.deepEqual(formatMessageToParts("Lang: {x}", { x: element }, en), ["Lang: ", element])
    })

    test("errors for missing or wrong values", () => {
        assert.throws(() => formatMessage("Hi {name}", {}, en), /Missing value/)
        assert.throws(() => formatMessage("{n, plural, other {#}}", { n: "2" }, en), /must be a number/)
    })
})

describe("parseMessage", () => {
    test("rejects invalid syntax", () => {
        for (const message of [
            "Hi {name",
            "Hi name}",
            "{n, plural, one {x}}",            // no "other"
            "{n, plural, lots {x} other {y}}",  // unknown category
            "{n, date}",                         // unsupported type
            "{n, select, other {x}}",            // unsupported type
            "<b>open",
            "<b>x</i>",
        ]) {
            assert.throws(() => parseMessage(message), undefined, message)
        }
    })

    test("signature: value names and tags", () => {
        assert.deepEqual(
            messageSignature("<b>{name}</b>: {count, plural, one {# {unit}} other {# {unit}s}}"),
            { arguments: ["count", "name", "unit"], tags: ["b"] }
        )
        assert.deepEqual(messageSignature("plain"), { arguments: [], tags: [] })
    })

    test("plural categories per plural", () => {
        assert.deepEqual(
            pluralCategories("{a, plural, =0 {x} one {x} other {x}} {b, plural, other {y}}"),
            [["one", "other"], ["other"]]
        )
    })
})

describe("createTranslator", () => {
    const messages = { nav: { signIn: "Sign in", hello: "Hello, <b>{name}</b>" }, top: "Top" }

    test("looks up keys, with and without namespace", () => {
        const t = createTranslator({ locale: "en-US", messages })
        assert.equal(t("top"), "Top")
        assert.equal(t("nav.signIn"), "Sign in")
        const nav = createTranslator({ locale: "en-US", messages, namespace: "nav" })
        assert.equal(nav("signIn"), "Sign in")
        assert.equal(nav("hello", { name: "Ada" }), "Hello, Ada")
        assert.deepEqual(nav.parts("hello", { name: "Ada", b: (chunks) => chunks.join("").toUpperCase() }), ["Hello, ADA"]) // adjacent strings are merged
        assert.equal(nav.has("signIn"), true)
        assert.equal(nav.has("missing"), false)
    })

    test("missing messages and format errors show the key and are reported", () => {
        const errors = []
        const t = createTranslator({ locale: "en-US", messages, namespace: "nav", onError: (error) => errors.push(error.message) })
        assert.equal(t("missing"), "nav.missing")
        assert.equal(t("hello"), "nav.hello") // no name given
        assert.equal(errors.length, 2)
    })
})

describe("negotiateLocale", () => {
    // a fixed list, so these tests don't depend on the configured languages
    const options = { locales: ["en", "de", "es"], defaultLocale: "en" }
    const negotiate = (header) => negotiateLocale(header, options)

    test("the first supported language of the browser's list wins", () => {
        assert.equal(negotiate("de-DE,de;q=0.9,en;q=0.8"), "de")
        assert.equal(negotiate("es-MX"), "es")
        assert.equal(negotiate("en-GB,en;q=0.9"), "en")
        assert.equal(negotiate("fr-FR,fr;q=0.9,de;q=0.8,en;q=0.7"), "de")
    })

    test("q values decide the order, not the position", () => {
        assert.equal(negotiate("en;q=0.5,es;q=0.9"), "es")
        assert.equal(negotiate("de;q=0,es"), "es") // q=0: not acceptable
    })

    test("falls back to the default language", () => {
        assert.equal(negotiate("fr-FR,fr;q=0.9,ja;q=0.8"), "en")
        assert.equal(negotiate("*"), "en")
        assert.equal(negotiate(""), "en")
        assert.equal(negotiate(null), "en")
        assert.equal(negotiate("garbage;;;q=x,,"), "en")
    })

    test("uses the configured languages by default", () => {
        assert.equal(negotiateLocale("xx-YY"), DEFAULT_LOCALE)
        for (const locale of LOCALES) assert.equal(negotiateLocale(`xx,${locale};q=0.5`), locale)
    })

    test("regional locales: exact match first, then the same language", () => {
        const options = { locales: ["en", "pt-BR", "pt-PT"], defaultLocale: "en" }
        assert.equal(negotiateLocale("pt-PT", options), "pt-PT")
        assert.equal(negotiateLocale("pt", options), "pt-BR")
        assert.equal(negotiateLocale("PT-br", options), "pt-BR")
    })

    test("parseAcceptLanguage", () => {
        assert.deepEqual(parseAcceptLanguage("de-CH, de;q=0.9, *;q=0.5, en;q=0.9"), ["de-ch", "de", "en"])
    })
})

describe("config", () => {
    test("every language has a unique code, its own name and a supported Intl locale", () => {
        assert.equal(new Set(LOCALES).size, LOCALES.length)
        assert.ok(LOCALES.includes(DEFAULT_LOCALE))
        for (const { code, name, intlLocale } of LANGUAGES) {
            assert.match(code, /^[a-z]{2,3}(-[A-Z]{2})?$/, code)
            assert.ok(name.trim(), `${code}: name`)
            assert.equal(Intl.DateTimeFormat.supportedLocalesOf([intlLocale]).length, 1, intlLocale)
        }
    })

    test("supported locales and fallback", () => {
        for (const locale of LOCALES) {
            assert.equal(isSupportedLocale(locale), true)
            assert.equal(getLanguage(locale).code, locale)
        }
        assert.equal(isSupportedLocale("xx"), false)
        assert.equal(isSupportedLocale(undefined), false)
        assert.equal(getLanguage("xx").code, DEFAULT_LOCALE)
    })
})

describe("createFormatter", () => {
    const date = new Date(2026, 10, 15) // Sunday, 15 November 2026

    test("dates in the app language", () => {
        const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
        assert.equal(createFormatter("en-US").date(date, options), "Sunday, November 15, 2026")
        assert.equal(createFormatter("de-DE").date(date, options), "Sonntag, 15. November 2026")
        assert.equal(createFormatter("es-ES").date(date, options), "domingo, 15 de noviembre de 2026")
    })

    test("date ranges", () => {
        const end = new Date(2026, 10, 21)
        const options = { day: "numeric", month: "short", year: "numeric" }
        assert.equal(createFormatter("en-US").dateRange(date, end, options), "Nov 15\u2009–\u200921, 2026")
        assert.equal(createFormatter("de-DE").dateRange(date, end, options), "15.–21. Nov. 2026")
    })

    test("numbers, decimals, percentages and lists", () => {
        const enFormat = createFormatter("en-US")
        const deFormat = createFormatter("de-DE")
        assert.equal(enFormat.decimal(7), "7.0")
        assert.equal(deFormat.decimal(6.5), "6,5")
        assert.equal(enFormat.percent(0.424), "42%")
        assert.equal(deFormat.percent(0.424), "42\u00a0%") // non-breaking space
        assert.equal(createFormatter("es-ES").percent(1), "100\u00a0%")
        assert.equal(deFormat.number(12345), "12.345")
        assert.equal(enFormat.list(["a", "b", "c"]), "a, b, and c")
        assert.equal(deFormat.list(["a", "b", "c"]), "a, b und c")
        assert.equal(createFormatter("es-ES").capitalize("lunes, 16 de noviembre"), "Lunes, 16 de noviembre")
        assert.equal(deFormat.capitalize("Montag"), "Montag")
    })
})
