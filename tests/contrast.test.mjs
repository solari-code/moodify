import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { blend, contrast, hslToRgb, readRules, resolvePalette, themeNames } from "./support/palette.mjs"
import { THEMES } from "../src/lib/appearance.js"

// Contrast of the color palettes in src/app/globals.css (WCAG 2.x, AA), for
// every theme in light and dark mode:
//
// - TEXT (4.5:1): all text on the surfaces it's used on
// - GRAPHICS (3:1): mood colors, chart lines, heatmap levels, focus rings and
//   the borders that are a control's only visible shape (WCAG 1.4.11)
// - INACTIVE (3:1): text of things that can't be used right now (days in the
//   future, disabled buttons). WCAG doesn't require any contrast for these,
//   but they must stay easy to read.
//
// Colors with opacity are measured as they look: blended onto what's below.
// When a component changes which colors it combines (or their opacity),
// update the pairs here.

const TEXT = 4.5
const GRAPHICS = 3
const INACTIVE = 3

// A color: a token name ("card"), or a token with opacity painted on another
// color ({ token: "primary", alpha: 0.5, over: "card" }).
function resolveColor(palette, color) {
    if (typeof color === "string") {
        if (!palette[color]) throw new Error(`color token --${color} is not defined`)
        return hslToRgb(palette[color])
    }
    return blend(resolveColor(palette, color.token), color.alpha, resolveColor(palette, color.over))
}

const MOODS = Array.from({ length: 11 }, (_, mood) => `mood-${mood}`)
const HEATMAP_LEVELS = ["heatmap-1", "heatmap-2", "heatmap-3", "heatmap-4"]
// where mood dots and bars are shown (secondary: today in the week strip,
// accent: today in the calendar)
const MOOD_SURFACES = ["background", "card", "popover", "muted", "secondary", "accent"]

// [what, foreground, background, minimum]
const PAIRS = [
    // text on the surfaces
    ...["background", "card", "popover", "muted", "secondary", "accent"].map((surface) => [`text on ${surface}`, "foreground", surface, TEXT]),
    ...["background", "card", "popover", "muted", "accent"].map((surface) => [`muted text on ${surface}`, "muted-foreground", surface, TEXT]),
    ["muted text on the overview tiles (muted/60 on card)", "muted-foreground", { token: "muted", alpha: 0.6, over: "card" }, TEXT],
    ["card text", "card-foreground", "card", TEXT],
    ["popover text", "popover-foreground", "popover", TEXT],
    ["primary button", "primary-foreground", "primary", TEXT],
    ["primary button, hovered (bg-tint)", "primary-foreground", { token: "foreground", alpha: 0.08, over: "primary" }, TEXT],
    ["secondary (badges, today in the week strip)", "secondary-foreground", "secondary", TEXT],
    ["hovered items", "accent-foreground", "accent", TEXT],
    ["primary as text (saved state, links) on background", "primary", "background", TEXT],
    ["primary as text on card", "primary", "card", TEXT],
    ...["background", "card", "popover"].map((surface) => [`error text on ${surface}`, "destructive", surface, TEXT]),
    ["destructive button", "destructive-foreground", "destructive", TEXT],
    ["destructive button, hovered (bg-tint)", "destructive-foreground", { token: "foreground", alpha: 0.08, over: "destructive" }, TEXT],
    ["lavender badge", "lavender-foreground", "lavender", TEXT],
    ["peach badge (streaks, local mode)", "peach-foreground", "peach", TEXT],
    ["demo data bar (peach/50 on background)", "peach-foreground", { token: "peach", alpha: 0.5, over: "background" }, TEXT],
    ...MOODS.map((mood) => [`mood value label on ${mood}/18 (check-in)`, "foreground", { token: mood, alpha: 0.18, over: "card" }, TEXT]),

    // inactive text: disabled buttons (muted style), future days
    ["disabled button", "muted-foreground", "muted", INACTIVE],
    ["future days (week strip, muted/75 on card)", { token: "muted-foreground", alpha: 0.75, over: "card" }, "card", INACTIVE],
    ["future days (calendar)", "muted-foreground", "popover", INACTIVE],

    // graphics: mood colors (dots, bars, chart points) on every surface they sit on
    ...MOODS.flatMap((mood) => [...MOOD_SURFACES, { token: "muted", alpha: 0.6, over: "card" }].map((surface) => [
        `${mood} on ${typeof surface === "string" ? surface : "overview tile"}`, mood, surface, GRAPHICS,
    ])),
    // chart
    ["chart: 7-day average line", "primary", "card", GRAPHICS],
    ["chart: daily mood line", "mood-line", "card", GRAPHICS],
    // heatmap: every level stands out from the card, and "logged, no habits" (ring) too
    ...HEATMAP_LEVELS.map((level) => [`heatmap: ${level} on card`, level, "card", GRAPHICS]),
    ["heatmap: ring of 'logged, no habits' on card", "heatmap-0", "card", GRAPHICS],
    ["heatmap: ring of 'logged, no habits' on its cell (muted)", "heatmap-0", "muted", GRAPHICS],
    // focus ring, form controls
    ...["background", "card", "popover"].map((surface) => [`focus ring on ${surface}`, "ring", surface, GRAPHICS]),
    ...["background", "card", "accent"].map((surface) => [`checkbox / text field border on ${surface}`, "control", surface, GRAPHICS]),
    ["checked checkbox, chosen option (primary) on card", "primary", "card", GRAPHICS],
    ["checked checkbox on its done row (secondary)", "primary", "secondary", GRAPHICS],
]

// Each heatmap level must be clearly different from the next one.
const HEATMAP_STEP = 1.3

const rules = readRules()
const STATES = [
    { name: "landing (no theme)", attrs: {} },
    ...themeNames(rules).map((theme) => ({ name: theme, attrs: { "data-theme": theme } })),
].flatMap(({ name, attrs }) => [
    { name: `${name} light`, classes: [], attrs },
    { name: `${name} dark`, classes: ["dark"], attrs },
])

for (const state of STATES) {
    describe(`contrast: ${state.name}`, () => {
        const palette = resolvePalette(rules, state)

        test("text, graphics and inactive text reach their minimum contrast", () => {
            const failures = PAIRS.flatMap(([what, foreground, background, minimum]) => {
                let ratio
                try {
                    ratio = contrast(resolveColor(palette, foreground), resolveColor(palette, background))
                } catch (error) {
                    return [`${what}: ${error.message}`]
                }
                return ratio >= minimum ? [] : [`${what}: ${ratio.toFixed(2)} (needs ${minimum})`]
            })
            assert.deepEqual(failures, [])
        })

        test("heatmap levels are clearly apart from each other", () => {
            const missing = HEATMAP_LEVELS.filter((level) => !palette[level])
            assert.deepEqual(missing, [], "heatmap levels not defined")
            const colors = HEATMAP_LEVELS.map((level) => resolveColor(palette, level))
            const failures = colors.slice(1).flatMap((color, i) => {
                const ratio = contrast(colors[i], color)
                return ratio >= HEATMAP_STEP ? [] : [`${HEATMAP_LEVELS[i]} -> ${HEATMAP_LEVELS[i + 1]}: ${ratio.toFixed(2)}`]
            })
            assert.deepEqual(failures, [])
        })
    })
}

describe("palette file", () => {
    const isOnly = (selector, classes, attrs) => !selector.nested
        && selector.classes.join() === classes.join()
        && JSON.stringify(selector.attrs) === JSON.stringify(attrs)
    const ruleFor = (classes, attrs = {}) => rules.find((rule) => rule.selectors.some((selector) => isOnly(selector, classes, attrs)))

    test("every theme of the settings has palettes, and no others", () => {
        assert.deepEqual(themeNames(rules).sort(), [...THEMES].sort())
    })

    // otherwise dark mode would silently use a light color
    test("the dark palette sets every color of the light one", () => {
        const light = Object.keys(resolvePalette(rules, { classes: [] }))
        assert.deepEqual(light.filter((token) => !(token in ruleFor(["dark"]).vars)), [])
    })

    test("every theme's dark palette sets every color of its light one", () => {
        const problems = THEMES.filter((theme) => theme !== "sage").flatMap((theme) => {
            const light = ruleFor([], { "data-theme": theme })
            const dark = ruleFor(["dark"], { "data-theme": theme })
            if (!light || !dark) return [`${theme}: light or dark palette missing`]
            return Object.keys(light.vars).filter((token) => !(token in dark.vars)).map((token) => `${theme}: --${token}`)
        })
        assert.deepEqual(problems, [])
    })
})
