module.exports = [
  {
    name: "cjs main",
    path: "./_build/index.cjs",
    gzip: true,
  },
  {
    name: "cjs all",
    path: "./_build/**/*.cjs",
    gzip: true,
  },
  {
    name: "cjs providers - [GoogleV2]",
    path: "./_build/googleV2.cjs",
    gzip: true,
  },
  {
    name: "cjs providers - [Turnstile]",
    path: "./_build/turnstile.cjs",
    gzip: true,
  },
  {
    name: "esm all",
    path: "./_build/**/*.js",
    gzip: true,
  },
  {
    name: "esm main",
    path: "./_build/index.js",
    gzip: true,
  },
  {
    name: "cjs providers - [GoogleV2]",
    path: "./_build/googleV2.js",
    gzip: true,
  },
  {
    name: "mjs providers - [Turnstile]",
    path: "./_build/turnstile.js",
    gzip: true,
  },
];
