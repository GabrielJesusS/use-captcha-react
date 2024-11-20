module.exports = [
  {
    name: "cjs main",
    path: "./_build/main/**/*.js",
    gzip: true,
  },
  {
    name: "cjs all",
    path: "./_build/**/*.js",
    gzip: true,
  },
  {
    name: "cjs providers",
    path: "./_build/providers/*.js",
    gzip: true,
  },
  {
    name: "esm all",
    path: "./_build/**/*.mjs",
    gzip: true,
  },
  {
    name: "esm main",
    path: "./_build/main/**/*.mjs",
    gzip: true,
  },
  {
    name: "esm providers",
    path: "./_build/providers/*.mjs",
    gzip: true,
  },
];
