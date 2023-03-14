#!/usr/bin/env zx

const _ = require("../lib/lodash/lodash");

async function getRepoFile(name, type = "default") {
    try {
        return await fs.readJson(`.repo/${name}.${type}.json`);
    } catch (_) {
        return {};
    }
}

function createSubmoduleString({ path, url }) {
    return `
[submodule "${path}"]
	path = ${path}
	url = ${url}
`;
}

async function createSubmoduleFile(modules) {
    return modules.map(createSubmoduleString).join("\n");
}

async function getSettings() {
    const defaultSettings = await getRepoFile("settings");
    const overrideSettings = await getRepoFile("settings", "override");
    return _.merge(defaultSettings, overrideSettings);
}

async function run() {
    if (await fs.pathExists(".gitmodules")) {
        echo`.gitmodules installed, do nothing.`;
        return;
    }
    const settings = await getSettings();
    const content = await createSubmoduleFile(settings["git-submodules"]);
    echo`Creating .gitmodules file.`;
    await fs.writeFile(".gitmodules", content, { encoding: "utf-8" });
    echo`Initializing git submodules`;
    $`git submodule update --init --recursive`;
}

await run();
