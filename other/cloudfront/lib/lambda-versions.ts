// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const versionVariableName = 'CF_LAMBDA_VERSION';

async function* walk(dir: string): AsyncGenerator {
    for await (const d of await fs.promises.opendir(dir)) {
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
async function main() {
    for await (const file of walk('dist/lambda')) {
        let fileContent = fs.readFileSync(file).toString('utf-8');
        if (fileContent.includes(versionVariableName)) {
            fileContent = fileContent.substring(0, fileContent.lastIndexOf('\n'));
        }
        fileContent += `\nconst ${versionVariableName} = ${+new Date};`;

        fs.writeFileSync(file, fileContent);
    }
}

main();
