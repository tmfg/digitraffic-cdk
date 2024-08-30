import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import { globby } from "globby";

const inputs = (await globby([`src/lambda/**/*.ts`])).filter((input) => !input.includes("lambda-creator"));

const defaultPlugins = [
    nodeResolve({
        exportConditions: ["node", "default", "module", "import", "require"],
        preferBuiltins: true
    }),
    typescript(),
    commonjs(),
    json()
];

const excludeTerser = ["lambda-redirect-history", "lambda-index-html"];

export default inputs.map((input) => {
    const outputFile = input.replace("src/", "dist/").replace(".ts", ".js");

    const plugins = [...defaultPlugins];

    if (!excludeTerser.some((exclude) => input.includes(exclude))) {
        plugins.push(terser());
    }

    return {
        output: {
            inlineDynamicImports: true,
            file: outputFile,
            format: "es"
        },
        input,
        plugins
    };
});
