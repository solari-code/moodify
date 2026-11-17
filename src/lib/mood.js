// Emoji for each mood value 0-10. Faces only (no hands, hearts or other
// extras), so the whole scale looks like one consistent set on every platform.
const MOOD_EMOJIS = [
    "😭", // 0 Awful
    "😢", // 1 Very bad
    "😞", // 2 Bad
    "😟", // 3 Low
    "🙁", // 4 Meh
    "😐", // 5 Okay
    "🙂", // 6 Fine
    "😊", // 7 Good
    "😄", // 8 Very good
    "😁", // 9 Great
    "😍", // 10 Amazing
]

export function moodEmoji(mood) {
    return MOOD_EMOJIS[mood] ?? "🤷‍♂️" // Unknown mood
}

// The short word for each mood value ("Awful" … "Amazing") is a translated
// text: moodLabels.<0-10> in src/i18n/messages/.

// CSS color of a mood on the theme's mood scale (--mood-0 … --mood-10 in
// globals.css). Accepts averages too: the value is rounded and clamped to 0–10.
// alpha: optional opacity from 0 to 1.
// No valid number (e.g. no entry): the neutral muted text color.
export function moodColor(mood, alpha) {
    if (!Number.isFinite(mood)) return "hsl(var(--muted-foreground))"
    const step = Math.min(10, Math.max(0, Math.round(mood)))
    return alpha === undefined
        ? `hsl(var(--mood-${step}))`
        : `hsl(var(--mood-${step}) / ${alpha})`
}
