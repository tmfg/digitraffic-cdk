import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const plugins = [
    nodeResolve({
        preferBuiltins: true,
        exportConditions: ["node"]
    }),
    json(),
    commonjs(),
    typescript(),
    babel({
        presets: [
            [
                "@babel/preset-env",
                {
                    targets: {
                        esmodules: true
                    }
                }
            ]
        ],
        babelHelpers: "bundled"
    }),
    terser()
];

const outputOptions = (fileName) => ({
    file: `dist/lambda/${fileName}/${fileName}.mjs`,
    format: "esm",
    sourcemap: true
});

export default [
    {
        input: "src/lambda/process-queue/process-queue.ts",
        output: outputOptions("process-queue"),
        plugins
    },
    {
        input: "src/lambda/process-dlq/process-dlq.ts",
        output: outputOptions("process-dlq"),
		plugins
	},
	{
        input: "src/lambda/get-active-messages/get-active-messages.ts",
        output: outputOptions("get-active-messages"),
        plugins
    }
];
