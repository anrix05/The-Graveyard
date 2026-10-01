import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "jsx-a11y/alt-text": "error",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
];
