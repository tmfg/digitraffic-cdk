import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import { globby } from "globby";

const excludedFiles = ["lambda-creator", "lambda-stream-to-elastic", "logging-util"];

const inputs = (await globby([`src/lambda/**/*.ts`])).filter((input) => {
    return !excludedFiles.some((file) => input.includes(file));
});

const defaultPlugins = [
    nodeResolve({
        exportConditions: ["node", "default", "module", "import", "require"],
        preferBuiltins: true
    }),
    typescript(),
    commonjs(),
    json()
];

const excludeTerser = [
    "lambda-redirect-history",
    "lambda-index-html",
    "lambda-stream-to-elastic",
    "logging-util"
];
//const moduleJs = ["lambda-stream-to-elastic", "logging-util"]

export default inputs.map((input) => {
    const isOutputEsm = false; // moduleJs.some((esm) => input.includes(esm))
    const outputFile = isOutputEsm
        ? input.replace("src/", "dist/").replace("ts", "mjs")
        : input.replace("src/", "dist/").replace("ts", "cjs");

    const plugins = [...defaultPlugins];

    if (!excludeTerser.some((exclude) => input.includes(exclude))) {
        plugins.push(terser());
    }

    return {
        output: {
            inlineDynamicImports: true,
            file: outputFile,
            format: isOutputEsm ? "es" : "cjs"
        },
        input,
        plugins
    };
});
