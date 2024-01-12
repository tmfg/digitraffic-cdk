const esModules = ["@middy"].join("|")

module.exports = {
    roots: ["<rootDir>/test", "<rootDir>/lib"],
    collectCoverage: true,
    collectCoverageFrom: ["lib/**/*.ts"],
    coverageDirectory: "output/coverage/jest",
    coveragePathIgnorePatterns: [
        "<rootDir>/lib/.*.d.ts$",
        "<rootDir>/lib/canaries/.*.ts$",
        "<rootDir>/lib/(canaries|.*-api|.*-stack|internal-.*).ts$"
    ],
    testMatch: ["**/*.test.ts"],
    transform: {
        "^.+\\.ts?$": [
            "ts-jest",
            {
                useESM: true
            }
        ]
    },
    transformIgnorePatterns: [`node_modules/(?!${esModules})`],
    testResultsProcessor: "jest-junit",
};
