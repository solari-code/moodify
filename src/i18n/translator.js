import { formatMessage, formatMessageToParts } from "./messageFormat.js"

// Creates the translation function for one language and (optionally) one
// namespace of the messages, e.g. createTranslator({ ..., namespace: "nav" })
// and then t("signIn") for the message at "nav.signIn".
//
//   t(key, values)       -> string (tags are removed, their content stays)
//   t.parts(key, values) -> list of parts for rich text (strings and the
//                           results of the tag functions in `values`);
//                           see src/i18n/react.js for the React version
//   t.has(key)           -> whether the message exists
//
// locale:     Intl locale for numbers and plurals (e.g. "de-DE")
// messages:   the language's messages (nested objects, strings at the leaves)
// onError:    called with an Error when a message is missing or can't be
//             formatted; the key is shown instead, so the page still renders
//
// Relative imports only, so this runs in Node's test runner directly.
export function createTranslator({ locale, messages, namespace, onError = reportError }) {

    function lookup(key) {
        const path = namespace ? `${namespace}.${key}` : key
        const message = path.split(".").reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), messages)
        return { path, message }
    }

    function run(key, format) {
        const { path, message } = lookup(key)
        if (typeof message !== "string") {
            onError(new Error(`Missing message "${path}"`))
            return null
        }
        try {
            return format(message)
        } catch (error) {
            onError(new Error(`Could not format message "${path}": ${error.message}`))
            return null
        }
    }

    function t(key, values) {
        return run(key, (message) => formatMessage(message, values, { locale })) ?? fallbackKey(namespace, key)
    }

    t.parts = (key, values) => run(key, (message) => formatMessageToParts(message, values, { locale })) ?? [fallbackKey(namespace, key)]

    t.has = (key) => typeof lookup(key).message === "string"

    return t
}

function fallbackKey(namespace, key) {
    return namespace ? `${namespace}.${key}` : key
}

function reportError(error) {
    console.error(`[i18n] ${error.message}`)
}
