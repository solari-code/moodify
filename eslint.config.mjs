import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// ESLint 9 flat config; `next lint` was removed in Next.js 16,
// linting runs via `npm run lint` (eslint directly).
const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", ".data/**"]),
]);

export default eslintConfig;
