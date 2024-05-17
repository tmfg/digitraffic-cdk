// This is a workaround for https://github.com/eslint/eslint/issues/3458
require("@rushstack/eslint-config/patch/modern-module-resolution");

module.exports = {
    extends: ["@digitraffic/eslint-config/profile/allow-console-log"],
    parserOptions: { project: "./tsconfig.eslint.json" }
};
