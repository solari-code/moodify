import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

// false during server rendering and hydration, true afterwards in the browser.
//
// For UI that depends on browser-only information such as the user's
// timezone: rendering it on the server too would produce different HTML
// whenever the server's "today" differs from the user's (hydration mismatch).
export function useIsClient() {
    return useSyncExternalStore(subscribe, () => true, () => false)
}
