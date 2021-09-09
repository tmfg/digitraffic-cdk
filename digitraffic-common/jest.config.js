module.exports = {
    "roots": [
        "<rootDir>/__tests__"
    ],
    testMatch: ['**/*.test.ts'],
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    testResultsProcessor: "jest-junit"
}
