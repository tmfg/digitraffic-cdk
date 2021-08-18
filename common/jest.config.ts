module.exports = {
    "roots": [
        "<rootDir>/test"
    ],
    testMatch: ['**/*.test.ts'],
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    testResultsProcessor: "jest-junit"
}
