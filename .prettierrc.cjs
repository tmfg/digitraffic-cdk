module.exports = {
    plugins: ["./common/autoinstallers/rush-prettier/node_modules/prettier-plugin-packagejson/lib/index.cjs"],

    printWidth: 110,
    endOfLine: "auto",
    singleQuote: false,

    // For ES5, trailing commas cannot be used in function parameters
    trailingComma: "none",
    overrides: [
        {
            files: ["*.json", "*.yml", "*.yaml"],
            options: {
                tabWidth: 2
            }
        }
    ]
};
