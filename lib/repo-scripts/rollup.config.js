import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import { globby } from "globby";

const inputs = await globby([`src/cli/**/*.ts`]);

export default inputs.map((input) => {
  const outputDir = "dist";
  const outputFile = input.replace("src/cli", outputDir).replace(
    /\.ts$/,
    ".mjs",
  );
  return {
    input,
    external: ["zx"],
    output: {
      file: outputFile,
      format: "es",
      interop: "auto",
    },
    plugins: [
      nodeResolve({
        exportConditions: ["node", "default", "module", "import", "require"],
        preferBuiltins: true,
      }),
      typescript({
        compilerOptions: {
          outDir: outputDir,
        },
      }),
      commonjs(),
      json(),
      terser(),
    ],
  };
});
