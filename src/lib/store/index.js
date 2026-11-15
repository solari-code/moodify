import { isLocalMode } from "@/lib/mode"
import { createJsonStore } from "./jsonStore"
import { mongoStore } from "./mongoStore"

// Returns the storage backend for the current mode. Both backends offer the
// same functions, so server actions don't need to know which one is active.
//
// Server-only: must not be imported from client components.
export function getStore() {
    return isLocalMode() ? createJsonStore() : mongoStore
}
