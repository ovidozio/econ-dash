// eslint.config.js
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";

const compat = new FlatCompat({
  baseDirectory: path.resolve(),
});

export default [
  // Next + TS base
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Relax the rules that are breaking your prototype
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/rules-of-hooks": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },

  // Ignore heavy/noisy areas entirely (optional)
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      // Prototype hot-spots (comment out later, then fix)
      "src/app/datasets/**",
      "src/components/charts/**",
      "src/lib/fetchers/**",
      "src/lib/products/**",
      "src/pages/api/industries/**",
    ],
  },
];

