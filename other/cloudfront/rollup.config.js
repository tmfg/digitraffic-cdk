import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import { globby } from "globby";

const inputs = await globby([`lib/lambda/**/*.js`]);

export default inputs.map((input) => {
    const outputFile = input.replace("lib/", "dist/");
    return {
        input,
        output: {
            inlineDynamicImports: true,
            file: outputFile,
            format: "cjs"
        },
        plugins: [
            nodeResolve({
                exportConditions: ["node", "default", "module", "import", "require"],
                preferBuiltins: true
            }),
            commonjs(),
            json(),
            terser()
        ]
    };
});
