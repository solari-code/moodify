import { LIMITS } from "../lib/validation.js"

// The message for an error code: errors.<code> in the messages, filled in
// with the validation limits (e.g. "at most {maxLength} characters").
// Unknown codes get a general "Something went wrong" message.
//
// Error codes come from the server actions (e.g. "habitExists") or from the
// client itself (e.g. "saveFailed" when the server can't be reached). Keeping
// the code instead of the text in state means a shown error follows a
// language switch.
//
// t: translator for all messages (useTranslations() without namespace)
export function errorMessage(t, code) {
    const key = `errors.${code}`
    return t.has(key) ? t(key, LIMITS) : t("errors.unknown")
}
