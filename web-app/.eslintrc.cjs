/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs", "node_modules"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["react-refresh"],
  rules: {
    // React Fast Refresh — warn only (HMR concern, not correctness)
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

    // Unused vars: underscore-prefixed names are allowed (matches tsconfig pattern)
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
    ],

    // `any` is a warning — we may need escape hatches in mock code
    "@typescript-eslint/no-explicit-any": "warn",

    // Allow empty catch blocks (used deliberately in mock API)
    "no-empty": ["error", { allowEmptyCatch: true }],

    // Allow non-null assertions (common in React event handlers)
    "@typescript-eslint/no-non-null-assertion": "warn",
  },
};
