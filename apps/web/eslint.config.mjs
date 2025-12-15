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
      // SonarJS - Code Quality & Best Practices (relaxed)
      "sonarjs/cognitive-complexity": "off", // Too strict for complex business logic
      "sonarjs/no-duplicate-string": "off", // Allow string duplication for readability
      "sonarjs/no-identical-functions": "off", // Allow similar functions
      "sonarjs/no-unused-collection": "error", // Keep this as error
      "sonarjs/prefer-immediate-return": "off", // Allow intermediate variables
      "sonarjs/no-nested-conditional": "off", // Allow nested ternary for readability
      "sonarjs/no-ignored-exceptions": "off", // Allow empty catch blocks
      "sonarjs/no-dead-store": "off", // Allow unused assignments
      "sonarjs/unused-import": "off", // Allow unused imports temporarily
      "sonarjs/no-unused-vars": "off", // Handled by TypeScript
      "sonarjs/no-nested-functions": "off", // Allow nested functions
      "sonarjs/code-eval": "off", // Allow dynamic code execution
      "sonarjs/regex-complexity": "off", // Allow complex regex
      "sonarjs/no-commented-code": "off", // Allow commented code
      "sonarjs/no-duplicated-branches": "off", // Allow duplicate branches
      "sonarjs/no-require-imports": "off", // Allow require imports
      
      // Promise - Error Handling (relaxed)
      "promise/catch-or-return": "off", // Allow promises without catch
      "promise/always-return": "off", // Allow promises without return
      "promise/no-nesting": "off", // Allow nested promises
      
      // Next.js Performance (keep important ones)
      "@next/next/no-img-element": "warn", // Downgrade to warning
      "@next/next/no-html-link-for-pages": "warn", // Downgrade to warning
      "@next/next/no-sync-scripts": "error", // Keep as error
      "@next/next/google-font-display": "off", // Turn off
      "@next/next/google-font-preconnect": "off", // Turn off
      
      // React specific rules (relaxed)
      "react/react-in-jsx-scope": "off", // Not needed for Next.js 13+
      "react/prop-types": "off", // Use TypeScript instead
      "react/jsx-uses-react": "off",
      "react/jsx-no-leaked-render": "off", // Allow potential leaked renders
      "react/no-unescaped-entities": "off", // Allow unescaped entities

      // React Hooks specific rules (relaxed)
      "react-hooks/rules-of-hooks": "error", // Keep this as error
      "react-hooks/exhaustive-deps": "off", // Turn off dependency warnings

      // General code quality rules (relaxed)
      "no-console": "off", // Allow all console statements
      "no-debugger": "error", // Keep debugger as error
      "no-unused-vars": "off", // Turn off, handled by TypeScript
      "@typescript-eslint/no-unused-vars": "off", // Turn off TypeScript unused vars
      "@typescript-eslint/no-explicit-any": "off", // Allow any type
      "@typescript-eslint/no-require-imports": "off", // Allow require imports
      "prefer-const": "off", // Allow let instead of const
      "no-undef": "off", // Turn off undefined variable warnings
      "turbo/no-undeclared-env-vars": "off", // Turn off turbo env var warnings
      "no-empty-pattern": "off", // Allow empty destructuring patterns
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
  }
];
