import { nextJsConfig } from "@repo/eslint-config/next-js";
import sonarjs from "eslint-plugin-sonarjs";
import promisePlugin from "eslint-plugin-promise";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  sonarjs.configs.recommended,
  promisePlugin.configs['flat/recommended'],
  {
    rules: {
      // SonarJS - Code Quality & Best Practices
      "sonarjs/cognitive-complexity": ["warn", 15],
      "sonarjs/no-duplicate-string": ["warn", { threshold: 3 }],
      "sonarjs/no-identical-functions": "warn",
      "sonarjs/no-unused-collection": "error",
      "sonarjs/prefer-immediate-return": "warn",
      
      // Promise - Error Handling
      "promise/catch-or-return": "error",
      "promise/always-return": "error",
      "promise/no-nesting": "warn",
      
      // Next.js Performance
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-sync-scripts": "error",
      "@next/next/google-font-display": "warn",
      "@next/next/google-font-preconnect": "warn",
      // React specific rules
      "react/react-in-jsx-scope": "off", // Not needed for Next.js 13+
      "react/prop-types": "off", // Use TypeScript instead
      "react/jsx-uses-react": "off",
      "react/jsx-no-leaked-render": ["error", { validStrategies: ["coerce", "ternary"] }],

      // React Hooks specific rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // General code quality rules
      "no-console": ["warn", { allow: ["warn", "error"] }], // Warn for console.log, allow warn/error
      "no-debugger": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
  }
];
