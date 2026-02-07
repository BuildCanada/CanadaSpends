import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  // Global ignores - these files/directories are completely ignored
  {
    ignores: [
      ".venv/**",
      ".next/**",
      "node_modules/**",
      "**/(main)/spending/**",
      "**/(main)/federal/spending/**",
    ],
  },

  // Apply Next.js configs to all files
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),

  // Custom rules
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      // Override all other rules to warnings temporarily
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
      "no-var": "warn",
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
  // File-specific overrides for files
  {
    files: ["tailwind.config.ts", "scrapers/public_accounts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
