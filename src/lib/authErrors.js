// Auth.js sends sign-in problems to the landing page as ?error=<type> (see
// `pages` in auth.js). The landing page shows a notice with the message
// authErrors.<key> from src/i18n/messages/ for it.
//
// Relative imports only, so this runs in Node's test runner directly.

const KEYS = {
    // the user canceled on GitHub (or the sign-in wasn't allowed)
    OAuthCallbackError: "canceled",
    AccessDenied: "canceled",
    // the email address already belongs to an account with another sign-in
    OAuthAccountNotLinked: "accountNotLinked",
    AccountNotLinked: "accountNotLinked",
    // a problem on the server (Auth.js sends all other server errors as this type)
    Configuration: "configuration",
}

// All message keys, for the completeness test.
export const AUTH_ERROR_KEYS = [...new Set(Object.values(KEYS)), "default"]

// The message key for an error type from the URL; anything else (including
// unknown or missing types) gets the general message.
export function authErrorKey(type) {
    return typeof type === "string" && Object.hasOwn(KEYS, type) ? KEYS[type] : "default"
}
