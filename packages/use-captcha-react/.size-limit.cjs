module.exports = [
  {
    name: "cjs main",
    path: "./_build/index.js",
    gzip: true,
  },
  {
    name: "cjs all",
    path: "./_build/**/*.js",
    gzip: true,
  },
  {
    name: "cjs providers - [GoogleV2]",
    path: "./_build/googleV2.js",
    gzip: true,
  },
  {
    name: "cjs providers - [Turnstile]",
    path: "./_build/turnstile.js",
    gzip: true,
  },
  {
    name: "esm all",
    path: "./_build/**/*.mjs",
    gzip: true,
  },
  {
    name: "esm main",
    path: "./_build/index.mjs",
    gzip: true,
  },
  {
    name: "cjs providers - [GoogleV2]",
    path: "./_build/googleV2.mjs",
    gzip: true,
  },
  {
    name: "mjs providers - [Turnstile]",
    path: "./_build/turnstile.mjs",
    gzip: true,
  },
];
