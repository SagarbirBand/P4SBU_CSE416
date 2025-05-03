import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize FlatCompat to allow using legacy configurations
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Extend the Next.js ESLint presets for core web vitals and TypeScript
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
