# Changelog

All notable changes to this project are documented here, grouped by release. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [1.1.0] - 2026-07-27

### Added
- Full vitest test suite (hooks, all three providers, hash util) with coverage thresholds gated on pre-push.

### Fixed
- HCaptchaProvider called the wrong global (`grecaptcha` instead of `hcaptcha`) — a copy-paste bug that meant it never worked.
- `useLoadScript` leaked its manifest entry permanently when a hook unmounted while a script load was still in flight.
- `useLoadScript` could mark a late joiner as `loaded: true` without registering it as a consumer, making it unretryable and uncleanable.
- Failed script loads were indistinguishable from successful ones; the hook now reports load errors (`errored`) instead of swallowing them.
- Retrying after a failed load no longer orphans the old failed `<script>` tag in the DOM.
- Stale-closure bug: `useLoadScript`'s effect closed over `onUnload`/`globalVariables` without tracking their latest values, so cleanup could fire a stale callback.
- `package.json` `require` exports and size-limit esm globs pointed at `.js` files that tsdown never emits (it outputs `.cjs`/`.mjs`) — `require('use-captcha-react')` threw `MODULE_NOT_FOUND`.
- size-limit was missing HCaptcha rows entirely and mislabeled the Google V2/Turnstile esm rows.

### Changed
- Collapsed `useLoadScript`'s `loaded`/`errored` booleans into a single `status: "loading" | "loaded" | "error"`.
- Rewrote the script-loading state machine around a single `join()`/`settle()` pair instead of four overlapping if-blocks.
- Extracted `BaseCaptchaProvider` to dedupe ~85% shared logic across the Google reCAPTCHA v2, hCaptcha, and Cloudflare Turnstile providers.
- Captcha provider instance is now constructed lazily on first render instead of on every re-render.
- Dropped the FNV hash util; `scriptManifest` is now keyed by script `src` directly.
- Replaced `<any>window` casts with a single typed `Window & Record<string, unknown>` cast.
- Removed dead code: unused `id` field on `ScriptManifest`, redundant indirection wrappers, and an always-true guard in `isCallbackRegistered`.
- Package marked `sideEffects: false` so bundlers can tree-shake unused provider entry points.
- Build system switched from tsup to tsdown; added a fixed TypeScript version and new captcha env variables.
- Removed the changesets package and its notes; added symlinked README files per provider.

## [1.0.5] - 2026-02-02
### Changed
- Rolled back a types dependency version bump that had been applied in error.

## [1.0.4] - 2025-12-01
No functional changes; version bump only.

## [1.0.3] - 2025-11-30
### Changed
- Updated dependency versions and `tsconfig` module resolution; improved module resolution overall.
- Added a JSON schema for the tsup config.

## [1.0.2] - 2025-09-15
### Added
- `types` versions field in `package.json` to support Node's module resolution.

## [1.0.1] - 2025-03-21
### Fixed
- Script unload and parallel-loading bug in `useLoadScript`.
### Changed
- Removed a per-rule biome configuration in favor of the defaults.

## [1.0.0] - 2025-03-12
### Added
- hCaptcha provider, joining Google reCAPTCHA v2 and Cloudflare Turnstile as a standard provider.
- `captcha load` function to read/write captcha globals on `window`.

## [1.0.0-beta.2] - 2025-02-02
### Changed
- Bundle minification enabled.

## [1.0.0-beta.1] - 2025-02-02
### Changed
- Package entry points and `main` field reworked; `tsconfig` excluded from the npm package; docs URLs and README wiring fixed up.

## [1.0.0-beta] - 2025-01-25
### Added
- `CaptchaProvider` type exported from the package index.
- size-limit config for bundle size tracking.
### Fixed
- Multiple-Turnstile-instances bug and a script-loading race (missing checks around loading state and `window` globals).
### Changed
- Prop names adjusted for consistency; peer dependency and ES build target versions bumped.
- Provider extension documented.

## [0.0.3] - 2025-01-02
### Added
- Cloudflare Turnstile provider.
- Key validation on the Google reCAPTCHA v2 provider.
### Fixed
- Script re-run bug.

## [0.0.2] - 2024-11-24
### Added
- Initial package: `useLoadScript`/`useCaptcha` hooks, `CaptchaProvider` interface, Google reCAPTCHA v2 provider, bundle-size tooling, and project scaffolding (from `create-turbo`).
