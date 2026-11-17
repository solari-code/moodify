import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// No hardcoded UI text: everything users see or hear comes from the
// translations (src/i18n/messages/, see README "Languages").
//
// - text between JSX tags, also in {"…"}, {a ? "…" : "…"} and {a && "…"}
// - text in the attributes that are shown or read out (aria-label, title,
//   placeholder, …), also in {`…`} and {a ? "…" : "…"}
// - no Intl formatters or toLocale…String() outside src/i18n: they would use
//   the browser's language instead of the app's (use useFormatter/getFormatter)
//
// Allowed: symbols without words ("–", "·", "✓", "/"), the brand name
// "Moodify" (never translated), and strings passed to functions such as
// t("key") or cn("class names").
const TEXT_ATTRIBUTES = "aria-label|aria-description|aria-roledescription|aria-valuetext|alt|title|placeholder|label|ariaLabel|emptyText|description";
const HAS_LETTERS = "/[A-Za-zÀ-ÿ]/";
const TEXT_MESSAGE = "UI text must come from the translations: use t(\"…\") (see README \"Languages\").";
const INTL_MESSAGE = "Dates and numbers must follow the app language: use useFormatter() / getFormatter() from src/i18n.";

const noHardcodedText = {
  files: ["src/**/*.{js,jsx}"],
  ignores: ["src/i18n/**"],
  rules: {
    "react/jsx-no-literals": ["error", { noStrings: true, ignoreProps: true, allowedStrings: ["–", "·", "✓", "/", "Moodify"] }],
    "no-restricted-syntax": ["error",
      // between tags: {a ? "…" : "…"}, {a && "…"}, {`…`}
      ...["JSXElement", "JSXFragment"].flatMap((parent) => [
        { selector: `${parent} > JSXExpressionContainer > :matches(ConditionalExpression, LogicalExpression) > Literal[value=${HAS_LETTERS}]`, message: TEXT_MESSAGE },
        { selector: `${parent} > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=${HAS_LETTERS}]`, message: TEXT_MESSAGE },
      ]),
      // attributes that are shown or read out
      { selector: `JSXAttribute[name.name=/^(${TEXT_ATTRIBUTES})$/] > Literal[value=${HAS_LETTERS}]`, message: TEXT_MESSAGE },
      { selector: `JSXAttribute[name.name=/^(${TEXT_ATTRIBUTES})$/] > JSXExpressionContainer Literal[value=${HAS_LETTERS}]:not(CallExpression Literal)`, message: TEXT_MESSAGE },
      { selector: `JSXAttribute[name.name=/^(${TEXT_ATTRIBUTES})$/] > JSXExpressionContainer TemplateLiteral > TemplateElement[value.raw=${HAS_LETTERS}]`, message: TEXT_MESSAGE },
      // dates and numbers
      { selector: "NewExpression[callee.object.name='Intl']", message: INTL_MESSAGE },
      { selector: "CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]", message: INTL_MESSAGE },
    ],
  },
};

// ESLint 9 flat config; `next lint` was removed in Next.js 16,
// linting runs via `npm run lint` (eslint directly).
const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  noHardcodedText,
  globalIgnores([".next/**", "out/**", "build/**", ".data/**"]),
]);

export default eslintConfig;
