import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import promisePlugin from "eslint-plugin-promise";

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
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
      'promise': promisePlugin,
    },
    rules: {
      // CRITICAL: Prevent infinity pending / hang - ZERO TOLERANCE
      '@typescript-eslint/no-floating-promises': 'error', // Detect unhandled promises
      '@typescript-eslint/no-misused-promises': ['error', {
        checksVoidReturn: {
          arguments: false, // Allow asyncHandler pattern
          attributes: false,
        },
      }],
      '@typescript-eslint/await-thenable': 'error', // Ensure await is used correctly
      '@typescript-eslint/require-await': 'off', // Too many false positives with middleware
      '@typescript-eslint/promise-function-async': 'error', // Functions returning promises must be async
      'no-async-promise-executor': 'error', // Prevent async in Promise constructor
      'no-promise-executor-return': 'error', // Prevent return in Promise executor
      'prefer-promise-reject-errors': 'error', // Always reject with Error objects
      
      // Relaxed rules for development productivity
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-for-in-array': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/switch-exhaustiveness-check': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/no-unnecessary-type-conversion': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/array-type': 'off',
      'no-console': 'off',
      'no-debugger': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-duplicate-enum-values': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-useless-empty-export': 'off',
      '@typescript-eslint/prefer-literal-enum-member': 'off',
      '@typescript-eslint/prefer-ts-expect-error': 'off',
      '@typescript-eslint/sort-type-constituents': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'prefer-const': 'off',
      'require-yield': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
    }
  }
)