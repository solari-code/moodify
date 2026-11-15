// Decides whether Moodify runs in "local mode" (demo login + JSON file storage)
// or in the normal mode (GitHub login + MongoDB).
//
// Rules:
// - MOODIFY_LOCAL_MODE=true          -> local mode, always (also in production)
// - MONGODB_URI is set               -> normal mode
// - neither, during development      -> local mode (automatic)
// - neither, in production           -> error: a production server must not
//                                       silently fall back to local mode
//
// The check runs when a request is handled, not when the module is imported,
// so `next build` works without any environment variables.

const PRODUCTION_ERROR =
    "Moodify: MONGODB_URI is not set. In production, local mode has to be " +
    "enabled explicitly with MOODIFY_LOCAL_MODE=true (or set MONGODB_URI, " +
    "AUTH_SECRET, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET for the normal mode).";

export function isLocalMode() {
    if (process.env.MOODIFY_LOCAL_MODE === "true") return logOnce(true);
    if (process.env.MONGODB_URI) return false;
    if (process.env.NODE_ENV === "production") throw new Error(PRODUCTION_ERROR);
    return logOnce(true);
}

function logOnce(localMode) {
    if (!globalThis.__moodifyLocalModeLogged) {
        globalThis.__moodifyLocalModeLogged = true;
        console.info("Moodify is running in local mode (demo login, data stored in .data/).");
    }
    return localMode;
}
