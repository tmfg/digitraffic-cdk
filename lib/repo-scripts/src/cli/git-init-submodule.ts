#!/usr/bin/env node --input-type=module
/* eslint-disable no-unused-expressions */

import _ from "lodash";
import fs from "fs-extra";
import { $, echo } from "zx";

type FileType = "default" | "override";

interface Module {
    path: string;
    url: string;
}

interface Settings {
    "git-submodules": Module[];
}

async function getRepoFile(name: string, type: FileType = "default"): Promise<object> {
    try {
        return (await fs.readJson(`common/config/repo/${name}.${type}.json`)) as object;
    } catch (_) {
        return {};
    }
}

function createSubmoduleString({ path, url }: Module): string {
    return `
[submodule "${path}"]
	path = ${path}
	url = ${url}
`;
}

function createSubmoduleFile(modules: Module[]): string {
    return modules.map(createSubmoduleString).join("\n");
}

async function getSettings(): Promise<Settings> {
    const defaultSettings = await getRepoFile("settings", "default");
    const overrideSettings = await getRepoFile("settings", "override");
    return _.merge(defaultSettings, overrideSettings) as Settings;
}

async function run(): Promise<void> {
    if (await fs.pathExists(".gitmodules")) {
        echo`.gitmodules installed, do nothing.`;
        return;
    }
    const settings = await getSettings();
    const content = createSubmoduleFile(settings["git-submodules"]);
    echo`Creating .gitmodules file.`;
    await fs.writeFile(".gitmodules", content, { encoding: "utf-8" });
    echo`Initializing git submodules`;
    $`git submodule update --init --recursive`;
}

await run();
