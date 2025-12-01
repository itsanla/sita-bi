import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import promisePlugin from "eslint-plugin-promise";

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  sonarjs.configs.recommended,
  promisePlugin.configs['flat/recommended'],
  {
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Override or add stricter rules here
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'vars': 'all',
          'varsIgnorePattern': '^_',
          'args': 'after-used',
          'argsIgnorePattern': '^_',
          'caughtErrors': 'all',
          'caughtErrorsIgnorePattern': '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }], // Allow promises in Express handlers
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Warn for console logs
      'no-debugger': 'error', // Error for debugger statements
      '@typescript-eslint/no-unsafe-assignment': 'off', // Often too strict for Express req/res
      '@typescript-eslint/no-unsafe-member-access': 'off', // Often too strict for Express req/res
      '@typescript-eslint/no-unsafe-argument': 'off', // Often too strict for Express req/res
      '@typescript-eslint/no-unsafe-call': 'off', // Often too strict for Express req/res
      '@typescript-eslint/no-unsafe-return': 'off', // Often too strict for Express req/res
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      '@typescript-eslint/sort-type-constituents': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      
      // SonarJS - Code Quality
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-unused-collection': 'error',
      
      // Promise - Error Handling
      'promise/catch-or-return': 'error',
      'promise/always-return': 'error',
      'promise/no-nesting': 'warn',
    }
  }
)