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
        "^.+\\.tsx?$": "ts-jest"
    },
    testResultsProcessor: "jest-junit",
};
