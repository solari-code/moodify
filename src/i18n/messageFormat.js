// A small formatter for translation messages in ICU MessageFormat syntax
// (the format most translation tools understand), limited to what Moodify
// needs:
//
//   {name}                                      a value; numbers are formatted for the locale
//   {count, plural, =0 {…} one {…} other {…}}   plural; "#" is the formatted number
//   <b>…</b>                                    rich text, rendered by a function in `values`
//
// Everything else is plain text, so apostrophes ("isn't") need no escaping.
// There is no way to write a literal "{" or "<" followed by a letter.
//
// Relative imports only, so this runs in Node's test runner directly.

const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"]

export class MessageFormatError extends Error {}

// ---------------------------------------------------------------------------
// Parsing

// message string -> list of nodes:
//   { type: "text", value } | { type: "argument", name } | { type: "pound" }
//   { type: "plural", name, options: { "=0"|category: nodes } }
//   { type: "tag", name, children: nodes }
export function parseMessage(message) {
    if (typeof message !== "string") throw new MessageFormatError("Message must be a string")
    const parser = { source: message, index: 0 }
    const nodes = parseNodes(parser, { inPlural: false, endTag: null, inOption: false })
    if (parser.index < message.length) fail(parser, `Unexpected "${message[parser.index]}"`)
    return nodes
}

function fail(parser, text) {
    throw new MessageFormatError(`${text} in "${parser.source}"`)
}

function parseNodes(parser, context) {
    const nodes = []
    let text = ""
    const flushText = () => {
        if (text) nodes.push({ type: "text", value: text })
        text = ""
    }

    const { source } = parser
    while (parser.index < source.length) {
        const char = source[parser.index]

        if (char === "{") {
            flushText()
            nodes.push(parseArgument(parser, context))
        } else if (char === "}") {
            if (!context.inOption) fail(parser, `Unexpected "}"`)
            break // end of a plural option, handled by the caller
        } else if (char === "#" && context.inPlural) {
            flushText()
            nodes.push({ type: "pound" })
            parser.index++
        } else if (char === "<" && source[parser.index + 1] === "/") {
            if (!context.endTag) fail(parser, "Unexpected closing tag")
            break // closing tag, handled by parseTag
        } else if (char === "<" && /[a-zA-Z]/.test(source[parser.index + 1] ?? "")) {
            flushText()
            nodes.push(parseTag(parser, context))
        } else {
            text += char
            parser.index++
        }
    }
    flushText()
    return nodes
}

function skipSpace(parser) {
    while (/\s/.test(parser.source[parser.index] ?? "")) parser.index++
}

function readIdentifier(parser) {
    const match = /^[^\s{}<>,#=]+/.exec(parser.source.slice(parser.index))
    if (!match) fail(parser, "Expected a name")
    parser.index += match[0].length
    return match[0]
}

function expect(parser, char) {
    if (parser.source[parser.index] !== char) fail(parser, `Expected "${char}"`)
    parser.index++
}

function parseArgument(parser, context) {
    expect(parser, "{")
    skipSpace(parser)
    const name = readIdentifier(parser)
    skipSpace(parser)

    if (parser.source[parser.index] === "}") {
        parser.index++
        return { type: "argument", name }
    }

    expect(parser, ",")
    skipSpace(parser)
    if (readIdentifier(parser) !== "plural") fail(parser, `Only "plural" is supported as an argument type`)
    skipSpace(parser)
    expect(parser, ",")

    const options = parsePluralOptions(parser, context)
    expect(parser, "}")
    return { type: "plural", name, options }
}

function parsePluralOptions(parser, context) {
    const options = {}
    skipSpace(parser)
    while (parser.source[parser.index] !== "}") {
        if (parser.index >= parser.source.length) fail(parser, "Unterminated plural")

        let key
        if (parser.source[parser.index] === "=") {
            parser.index++
            const match = /^\d+/.exec(parser.source.slice(parser.index))
            if (!match) fail(parser, `Expected a number after "="`)
            parser.index += match[0].length
            key = `=${match[0]}`
        } else {
            key = readIdentifier(parser)
            if (!PLURAL_CATEGORIES.includes(key)) fail(parser, `Unknown plural category "${key}"`)
        }
        if (key in options) fail(parser, `Duplicate option "${key}"`)

        skipSpace(parser)
        expect(parser, "{")
        options[key] = parseNodes(parser, { ...context, inPlural: true, inOption: true })
        expect(parser, "}")
        skipSpace(parser)
    }
    if (!("other" in options)) fail(parser, `A plural needs an "other" option`)
    return options
}

function parseTag(parser, context) {
    expect(parser, "<")
    const name = readIdentifier(parser)
    expect(parser, ">")
    const children = parseNodes(parser, { ...context, endTag: name, inOption: false })
    const closing = `</${name}>`
    if (!parser.source.startsWith(closing, parser.index)) fail(parser, `Expected "${closing}"`)
    parser.index += closing.length
    return { type: "tag", name, children }
}

// ---------------------------------------------------------------------------
// Formatting

const numberFormats = new Map()
const pluralRules = new Map()

function numberFormat(locale) {
    let format = numberFormats.get(locale)
    if (!format) {
        format = new Intl.NumberFormat(locale)
        numberFormats.set(locale, format)
    }
    return format
}

function pluralRule(locale) {
    let rule = pluralRules.get(locale)
    if (!rule) {
        rule = new Intl.PluralRules(locale)
        pluralRules.set(locale, rule)
    }
    return rule
}

// Formats a message into a list of parts: strings, and whatever the tag
// functions / non-text values return (e.g. React elements). Adjacent strings
// are merged.
//
// locale: Intl locale for numbers and plural rules, e.g. "de-DE"
// values: { name: string | number | any, tagName: (childParts) => any }
//         Without a function for a tag, its content is used as plain text.
export function formatMessageToParts(message, values = {}, { locale }) {
    const parts = []
    formatNodes(parseMessage(message), values, locale, null, parts)
    return mergeStrings(parts)
}

// Formats a message into a string. Tags are removed (their content stays);
// values must be strings or numbers.
export function formatMessage(message, values = {}, { locale }) {
    const plainValues = Object.fromEntries(
        Object.entries(values).filter(([, value]) => typeof value !== "function")
    )
    return formatMessageToParts(message, plainValues, { locale })
        .map((part) => (typeof part === "string" ? part : String(part)))
        .join("")
}

function formatNodes(nodes, values, locale, pluralNumber, parts) {
    for (const node of nodes) {
        switch (node.type) {
            case "text":
                parts.push(node.value)
                break
            case "pound":
                parts.push(numberFormat(locale).format(pluralNumber))
                break
            case "argument": {
                const value = valueOf(values, node.name)
                parts.push(typeof value === "number" ? numberFormat(locale).format(value) : value)
                break
            }
            case "plural": {
                const number = valueOf(values, node.name)
                if (typeof number !== "number") throw new MessageFormatError(`"{${node.name}}" must be a number`)
                const option = node.options[`=${number}`]
                    ?? node.options[pluralRule(locale).select(number)]
                    ?? node.options.other
                formatNodes(option, values, locale, number, parts)
                break
            }
            case "tag": {
                const children = []
                formatNodes(node.children, values, locale, pluralNumber, children)
                const render = values[node.name]
                if (typeof render === "function") parts.push(render(mergeStrings(children)))
                else parts.push(...children)
                break
            }
        }
    }
}

function valueOf(values, name) {
    if (values[name] === undefined || values[name] === null) {
        throw new MessageFormatError(`Missing value for "{${name}}"`)
    }
    return values[name]
}

function mergeStrings(parts) {
    const merged = []
    for (const part of parts) {
        if (part === "") continue
        if (typeof part === "string" && typeof merged.at(-1) === "string") merged[merged.length - 1] += part
        else merged.push(part)
    }
    return merged
}

// ---------------------------------------------------------------------------
// Structure, for checking translations against each other (see tests)

// Everything a translation has to provide like the original: the names of the
// values it uses and its tags. { arguments: [...], tags: [...] }, sorted.
export function messageSignature(message) {
    const argumentNames = new Set()
    const tags = new Set()

    function walk(nodes) {
        for (const node of nodes) {
            if (node.type === "tag") {
                tags.add(node.name)
                walk(node.children)
            } else if (node.type === "plural") {
                argumentNames.add(node.name)
                Object.values(node.options).forEach(walk)
            } else if (node.type === "argument") {
                argumentNames.add(node.name)
            }
        }
    }
    walk(parseMessage(message))
    return { arguments: [...argumentNames].sort(), tags: [...tags].sort() }
}

// The plural categories (not "=N") of each plural in the message, e.g.
// [["one", "other"]] for "{count, plural, =0 {…} one {…} other {…}}".
export function pluralCategories(message) {
    const plurals = []
    function walk(nodes) {
        for (const node of nodes) {
            if (node.type === "plural") {
                plurals.push(Object.keys(node.options).filter((key) => !key.startsWith("=")))
                Object.values(node.options).forEach(walk)
            }
            if (node.children) walk(node.children)
        }
    }
    walk(parseMessage(message))
    return plurals
}
