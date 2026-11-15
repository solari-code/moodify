// Emoji for each mood value 0-10 (same as the original switch in DayTracker).
const MOOD_EMOJIS = [
    "😭", // 0 Very bad / Extremely sad
    "😢", // 1 Bad / Very sad
    "😩", // 2 Sad
    "😞", // 3 Neutral / Just okay
    "😐", // 4 Slightly happy
    "🙂", // 5 Happy
    "😊", // 6 Quite happy
    "😄", // 7 Happy
    "🤗", // 8 Very happy
    "🥰", // 9 Super happy
    "😍", // 10 Extremely happy
]

export function moodEmoji(mood) {
    return MOOD_EMOJIS[mood] ?? "🤷‍♂️" // Unknown mood
}
