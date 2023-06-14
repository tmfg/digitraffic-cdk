import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
    input: "src/lambda/process-queue/process-queue.ts",
    output: {
        file: "dist/lambda/process-queue.mjs",
        format: "esm",
        sourcemap: true
    },
    plugins: [
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
    ]
};
