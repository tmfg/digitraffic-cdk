module.exports = {
    extends: ["@rushstack/eslint-config/profile/node"],
    plugins: ["deprecation"],
    overrides: [
        {
            files: ["*.ts", "*.tsx"],
            rules: {
                // Use KLH instead of console logging
                "no-console": "error",

                // DT rules
                "deprecation/deprecation": "warn",
                "@typescript-eslint/no-non-null-assertion": "off",
                "@typescript-eslint/non-nullable-type-assertion-style": "error",
                "@typescript-eslint/no-explicit-any": "error",

                // rushstack rules
                "@rushstack/typedef-var": "off",
                "@typescript-eslint/naming-convention": "off",
                "@typescript-eslint/explicit-member-accessibility": "off",
                "@typescript-eslint/ban-types": [
                    "error",
                    {
                        extendDefaults: false, // (the complete list is in this file)
                        types: {
                            String: {
                                message: 'Use "string" instead',
                                fixWith: "string"
                            },
                            Boolean: {
                                message: 'Use "boolean" instead',
                                fixWith: "boolean"
                            },
                            Number: {
                                message: 'Use "number" instead',
                                fixWith: "number"
                            },
                            Object: {
                                message: 'Use "object" instead, or else define a proper TypeScript type:'
                            },
                            Symbol: {
                                message: 'Use "symbol" instead',
                                fixWith: "symbol"
                            },
                            Function: {
                                message: [
                                    'The "Function" type accepts any function-like value.',
                                    "It provides no type safety when calling the function, which can be a common source of bugs.",
                                    'It also accepts things like class declarations, which will throw at runtime as they will not be called with "new".',
                                    "If you are expecting the function to accept certain arguments, you should explicitly define the function shape.",
                                    `If you are using Lambda Function from AWS CDK use 'import { Function as AwsFunction } from "aws-cdk-lib/aws-lambda";'`
                                ].join("\n")
                            },
                            "{}": {
                                message: [
                                    '"{}" actually means "any non-nullish value".',
                                    '- If you want a type meaning "any object", you probably want "Record<string, unknown>" instead.',
                                    '- If you want a type meaning "any value", you probably want "unknown" instead.'
                                ].join("\n")
                            }
                        }
                    }
                ],

                // typescript-eslint/strict
                "@typescript-eslint/await-thenable": "error",
                "@typescript-eslint/no-floating-promises": "error",
                "@typescript-eslint/no-for-in-array": "error",
                "no-implied-eval": "off",
                "@typescript-eslint/no-implied-eval": "error",
                "@typescript-eslint/no-misused-promises": "error",
                "@typescript-eslint/no-unnecessary-type-assertion": "error",
                "@typescript-eslint/no-unsafe-argument": "error",
                "@typescript-eslint/no-unsafe-assignment": "error",
                "@typescript-eslint/no-unsafe-call": "error",
                "@typescript-eslint/no-unsafe-member-access": "error",
                "@typescript-eslint/no-unsafe-return": "error",
                "require-await": "off",
                "@typescript-eslint/require-await": "error",
                "@typescript-eslint/restrict-plus-operands": "error",
                "@typescript-eslint/restrict-template-expressions": "error",
                "@typescript-eslint/unbound-method": "error",
                "@typescript-eslint/consistent-type-imports": "error"
            }
        },
        {
            // CDK has some quirks and thus shouldn't apply all the rules against them.
            files: [
                "bin/**/*.ts",
                "*.cdk.ts",

                // old way
                "*-stack.ts",
                "*-api.ts",
                "*-app.ts",
                "internal-*.ts",
                "canaries.ts"
            ],
            rules: {
                "no-new": "off"
            }
        },
        {
            // Be less strict for unit tests
            files: [
                // Test files
                "*.test.ts",
                "*.test.tsx",
                "src/__test__/**/*.ts"
            ],
            rules: {
                // Allow console logging in unit tests
                "no-console": "off",

                "@typescript-eslint/no-explicit-any": "warn",

                // typescript-eslint/strict
                "@typescript-eslint/await-thenable": "warn",
                "@typescript-eslint/no-floating-promises": "warn",
                "@typescript-eslint/no-for-in-array": "warn",
                "@typescript-eslint/no-implied-eval": "warn",
                "@typescript-eslint/no-misused-promises": "warn",
                "@typescript-eslint/no-unnecessary-type-assertion": "warn",
                "@typescript-eslint/no-unsafe-argument": "warn",
                "@typescript-eslint/no-unsafe-assignment": "warn",
                "@typescript-eslint/no-unsafe-call": "warn",
                "@typescript-eslint/no-unsafe-member-access": "warn",
                "@typescript-eslint/no-unsafe-return": "warn",
                "@typescript-eslint/require-await": "warn",
                "@typescript-eslint/restrict-plus-operands": "warn",
                "@typescript-eslint/restrict-template-expressions": "warn",
                "@typescript-eslint/unbound-method": "warn"
            }
        }
    ],
    reportUnusedDisableDirectives: true
};
