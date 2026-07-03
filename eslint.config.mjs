import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cloud Functions is its own TS project (functions/tsconfig.json) — its
    // compiled output and node_modules aren't part of this Next.js lint scope.
    "functions/**",
    // Session-local git worktrees (created by agent tooling) are separate
    // checkouts, not part of this working tree's lint scope.
    ".claude/worktrees/**",
  ]),
  {
    rules: {
      // React Compiler strict rules that flag valid React patterns (prop-to-state sync,
      // auth initialization in effects, Date.now() in callbacks). These are performance
      // hints, not bugs, and the patterns here are intentional.
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

export default eslintConfig;
