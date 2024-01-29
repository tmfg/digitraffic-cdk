// This is a workaround for https://github.com/eslint/eslint/issues/3458
require("@rushstack/eslint-config/patch/modern-module-resolution");

module.exports = {
    extends: ["@digitraffic-cdk/eslint-config/profile/default"],
    parserOptions: { project: "./tsconfig.eslint.json" }
};
