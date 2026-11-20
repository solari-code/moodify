import { readFileSync } from "node:fs"

// Reads the color palettes from src/app/globals.css and measures contrast
// (WCAG 2.x), for tests/contrast.test.mjs.

const CSS_FILE = new URL("../../src/app/globals.css", import.meta.url)

// All rules that set color tokens, in source order:
// [{ selectors: [{ root, classes, attrs }], vars: { background: [h, s, l], … } }]
export function readRules(css = readFileSync(CSS_FILE, "utf8")) {
    const source = css.replace(/\/\*[\s\S]*?\*\//g, "")
    const rules = []
    for (const [, selectorText, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const vars = {}
        for (const [, name, h, s, l] of body.matchAll(/--([\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*;/g)) {
            vars[name] = [Number(h), Number(s), Number(l)]
        }
        if (Object.keys(vars).length === 0) continue
        rules.push({ selectors: selectorText.split(",").map(parseSelector), vars })
    }
    return rules
}

// Only the selector forms the palettes use: :root, .dark, [data-theme="x"]
// and combinations of them on the same element. Selectors for elements inside
// the page (".dark [data-theme="x"]", for the theme previews) never match
// <html>, so they're kept but never apply here.
function parseSelector(text) {
    const parts = text.trim().split(/\s+/)
    const selector = parts.at(-1)
    const rest = selector
        .replace(/^:root/, "")
        .replace(/\.[\w-]+/g, "")
        .replace(/\[[\w-]+(="[^"]*")?\]/g, "")
    if (rest !== "") throw new Error(`palette.mjs: unsupported selector "${selector}"`)
    return {
        nested: parts.length > 1,
        root: selector.startsWith(":root"),
        classes: [...selector.matchAll(/\.([\w-]+)/g)].map((m) => m[1]),
        attrs: Object.fromEntries([...selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)].map((m) => [m[1], m[2] ?? ""])),
    }
}

function matches(selector, state) {
    return !selector.nested
        && selector.classes.every((name) => state.classes.includes(name))
        && Object.entries(selector.attrs).every(([name, value]) => state.attrs[name] === value)
}

function specificity(selector) {
    return (selector.root ? 1 : 0) + selector.classes.length + Object.keys(selector.attrs).length
}

// The tokens that apply to <html> in a state, e.g. { classes: ["dark"],
// attrs: { "data-theme": "ocean" } }: later rules win over earlier ones with
// the same specificity, like in the browser.
export function resolvePalette(rules, state) {
    const full = { classes: state.classes ?? [], attrs: state.attrs ?? {} }
    return rules
        .map((rule, order) => {
            const hits = rule.selectors.filter((selector) => matches(selector, full))
            return hits.length ? { rule, order, specificity: Math.max(...hits.map(specificity)) } : null
        })
        .filter(Boolean)
        .sort((a, b) => a.specificity - b.specificity || a.order - b.order)
        .reduce((palette, { rule }) => ({ ...palette, ...rule.vars }), {})
}

// The values of data-theme that have their own rules (e.g. ["ocean"]).
export function themeNames(rules) {
    const names = rules.flatMap((rule) => rule.selectors.map((selector) => selector.attrs["data-theme"]))
    return [...new Set(names.filter(Boolean))]
}

// HSL (degrees, percent, percent) to sRGB channels 0–1.
export function hslToRgb([h, s, l]) {
    const sat = s / 100
    const light = l / 100
    const k = (n) => (n + h / 30) % 12
    const a = sat * Math.min(light, 1 - light)
    const f = (n) => light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
    return [f(0), f(8), f(4)]
}

// A color painted with `alpha` on top of another (both sRGB).
export function blend(top, alpha, bottom) {
    return top.map((channel, i) => channel * alpha + bottom[i] * (1 - alpha))
}

export function luminance(rgb) {
    const [r, g, b] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a, b) {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (light + 0.05) / (dark + 0.05)
}
