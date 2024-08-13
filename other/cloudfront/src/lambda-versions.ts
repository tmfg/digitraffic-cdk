import * as fs from "node:fs/promises";
import * as path from "node:path";
const versionVariableName = "CF_LAMBDA_VERSION";

async function* walk(dir: string): AsyncGenerator<string> {
    for await (const d of await fs.opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) {
            yield* walk(entry);
        } else if (d.isFile()) {
            yield entry;
        }
    }
}

/*
    This adds changing timestamp to lambda-code, thus making it
    possible to version lambdas(new version needs changes in source code)
 */
async function main(): Promise<void> {
    for await (const file of walk("lib/lambda")) {
        let fileContent = await fs.readFile(file, {
            encoding: "utf-8"
        });
        if (fileContent.includes(versionVariableName)) {
            fileContent = fileContent.substring(0, fileContent.lastIndexOf("\n"));
        }
        fileContent += `\nconst ${versionVariableName} = ${+new Date()};`;

        await fs.writeFile(file, fileContent);
    }
}

await main();
