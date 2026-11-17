import { Fragment, createElement } from "react"
import { createTranslator } from "./translator.js"

// The translator with rich text for React, used by server components
// (src/i18n/server.js) and client components (src/i18n/client.jsx).
//
//   t.rich("greeting", { name: "Ada", b: (chunks) => <strong>{chunks}</strong> })
//
// Tag functions get their content as one React node. Values can be React
// elements too (e.g. a <span lang="de"> around a word).
export function createReactTranslator(options) {
    const t = createTranslator(options)

    t.rich = (key, values = {}) => {
        const wrapped = Object.fromEntries(Object.entries(values).map(([name, value]) => [
            name,
            typeof value === "function" ? (parts) => value(toNode(parts)) : value,
        ]))
        return toNode(t.parts(key, wrapped))
    }

    return t
}

// Children as separate arguments: React needs no keys for them.
function toNode(parts) {
    return createElement(Fragment, null, ...parts)
}
