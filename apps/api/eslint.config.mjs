import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
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
      // Relaxed rules for development productivity
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-for-in-array': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
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
      'no-console': 'off', // Allow console statements
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
      '@typescript-eslint/require-await': 'off',
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
      
      // Basic code quality (keep minimal)
      'no-unused-vars': 'off',
      'no-undef': 'off',
    }
  }
)