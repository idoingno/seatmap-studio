# Repository Guidelines

## Project Structure & Module Organization

`seatmap-studio` is a React 18 + TypeScript visual editor for seat and space layouts, built on AntV X6 and Ant Design 4.

- `src/` - application code. Feature modules live in PascalCase folders (`CreateMatrix/`, `CreateCircle/`, `CanvasScaleToolbar/`); shared UI lives in `src/Components/`; cross-cutting code in `api/`, `services/`, `store/` (Redux Toolkit), `hooks/`, `utils/`, `config/`, and `types/`.
- `tests/e2e/` - Playwright specs (`*.spec.ts`).
- `public/` - static assets copied into the build (`index.html`).
- `scripts/` - Node utilities, e.g. the performance harness.
- `dist/` - webpack build output (generated, not committed).
- Root Markdown files (`REPAIR_SUMMARY.md`, `MIGRATION_GUIDE.md`, etc.) are status/report documents, not user docs.

## Build, Test, and Development Commands

Use `pnpm` (pinned to 9.0.0, Node >= 18).

- `pnpm install --frozen-lockfile` - install dependencies (matches CI).
- `pnpm start` / `pnpm serve` - run webpack-dev-server locally.
- `pnpm build` - production build to `dist/`; `pnpm build:dev` for a development build.
- `pnpm lint` - ESLint over `src/**/*.{ts,tsx}` and `tests/**/*.ts`.
- `pnpm typecheck` - `tsc --noEmit` (includes the `noUnusedLocals` guard).
- `pnpm test:e2e` - run the Playwright suite (starts its own dev server on port 18180).
- `pnpm test:perf` - run the seatmap performance benchmark.
- `pnpm serve:dist` - serve the already-built `dist/` for manual verification.

## Coding Style & Naming Conventions

- TypeScript with `jsx: react`, `noImplicitAny`, ES5 target; some legacy JS remains - match the style of surrounding code.
- 2-space indentation. Prettier 2.8 (`.prettierrc`) is the repo-wide formatter; ESLint 8 (`.eslintrc.json`, parser-only, core rule `no-duplicate-imports`) plus `tsc noUnusedLocals` keep dead code out. The husky pre-commit hook runs lint-staged (prettier + `eslint --fix`) and `pnpm typecheck` - do not bypass it.
- Components and files use PascalCase (`ErrorBoundary.tsx`, `GraphBehavior.tsx`); hooks use `useX` (`useFormModal`); utilities and config use camelCase as already present.
- Import antd via `babel-plugin-import`; avoid heavy new dependencies without discussion (bundle size is a tracked concern).

## Testing Guidelines

- E2E only, via Playwright (`@playwright/test`, Chromium desktop project). No unit-test framework is configured.
- Name specs `*.spec.ts` under `tests/e2e/` (e.g. `seatmap-regressions.spec.ts`).
- Add a regression spec for every interaction fix. CI runs the full suite with retries and 1 worker.
- The pre-commit hook deliberately does not run e2e; run `pnpm test:e2e` manually before committing behavior changes and let CI enforce it.

## Commit & Pull Request Guidelines

- History favors short, imperative summaries (e.g. "Fix seatmap selection and mobile header regressions"); `feat:`/`fix:` conventional prefixes are also used. Keep messages imperative and specific.
- PRs target `main`; CI (`.github/workflows/ci.yml`) must pass: frozen install, Playwright Chromium run, and production build.
- Include a clear description, link related issues, and attach screenshots or a screen recording for any visual or interaction change.

## Security & Configuration Tips

- Never commit `dist/`, `node_modules/`, or Playwright artifacts.
- Keep the lockfile intact - update dependencies by regenerating `pnpm-lock.yaml`, never hand-editing it.
