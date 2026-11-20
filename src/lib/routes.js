// App routes that more than one place needs to know about.
//
// Relative imports only, so this runs in Node's test runner directly.

export const DASHBOARD_PATH = "/dashboard"
export const SETTINGS_PATH = "/dashboard/settings"

// Whether a path belongs to the dashboard area (the dashboard and its
// sub-pages such as the settings), e.g. to hide landing-page-only UI there.
export function isDashboardPath(pathname) {
    return typeof pathname === "string"
        && (pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`))
}
