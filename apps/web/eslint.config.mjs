import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import pluginNext from "@next/eslint-plugin-next";
import sonarjs from "eslint-plugin-sonarjs";
import promisePlugin from "eslint-plugin-promise";

/** @type {import("eslint").Linter.Config[]} */
export default [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
  },
  sonarjs.configs.recommended,
  promisePlugin.configs['flat/recommended'],
  {
    rules: {
      // SonarJS - Code Quality & Best Practices (relaxed)
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/no-identical-functions": "off",
      "sonarjs/no-unused-collection": "error",
      "sonarjs/prefer-immediate-return": "off",
      "sonarjs/no-nested-conditional": "off",
      "sonarjs/no-ignored-exceptions": "off",
      "sonarjs/no-dead-store": "off",
      "sonarjs/unused-import": "off",
      "sonarjs/no-unused-vars": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/code-eval": "off",
      "sonarjs/regex-complexity": "off",
      "sonarjs/no-commented-code": "off",
      "sonarjs/no-duplicated-branches": "off",
      "sonarjs/no-require-imports": "off",

      // Promise - Error Handling (relaxed)
      "promise/catch-or-return": "off",
      "promise/always-return": "off",
      "promise/no-nesting": "off",

      // Next.js Performance (keep important ones)
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "@next/next/no-sync-scripts": "error",
      "@next/next/google-font-display": "off",
      "@next/next/google-font-preconnect": "off",

      // React specific rules (relaxed)
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-no-leaked-render": "off",
      "react/no-unescaped-entities": "off",

      // React Hooks specific rules (relaxed)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",

      // General code quality rules (relaxed)
      "no-console": "off",
      "no-debugger": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "prefer-const": "off",
      "no-undef": "off",
      "no-empty-pattern": "off",
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
  }
];
