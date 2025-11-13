// This is a workaround for https://github.com/eslint/eslint/issues/3458
require("@rushstack/eslint-config/patch/modern-module-resolution");

module.exports = {
  extends: ["@digitraffic/eslint-config/profile/default"],
  parserOptions: { tsconfigRootDir: __dirname },
  overrides: [
    // Override for JS files
    {
      files: ["src/**/*.js"],
      parser: "espree", // default JS parser
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      env: {
        browser: true,
        es2022: true,
      },
      rules: {
        // optionally disable TS-specific rules for JS files
      },
    },
  ],
};
