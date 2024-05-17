# Digitraffic.fi eslint-config

This eslint-config is meant for use in https://github.com/tmfg/digitraffic-cdk/ and other Digitraffic.fi Nodejs components.

To use, configure eslint to extend one of the configs in this package. Example .esconfig.js:
```
// This is a workaround for https://github.com/eslint/eslint/issues/3458
require("@rushstack/eslint-config/patch/modern-module-resolution");

module.exports = {
    extends: ["@digitraffic/eslint-config/profile/default"],
    parserOptions: { tsconfigRootDir: __dirname }
};
```
