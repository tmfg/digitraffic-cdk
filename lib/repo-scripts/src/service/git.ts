/* eslint-disable no-unused-expressions */
import type { Module } from "./settings";
import fs from "fs-extra";
import { $, echo } from "zx";
import * as Settings from "../service/settings";

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

export async function init(): Promise<void> {
    if (await fs.pathExists(".gitmodules")) {
        echo`.gitmodules installed, do nothing.`;
        return;
    }
    const settings = await Settings.getSettings();
    const content = createSubmoduleFile(settings["git-submodules"]);
    echo`Creating .gitmodules file.`;
    await fs.writeFile(".gitmodules", content, { encoding: "utf-8" });
    echo`Initializing git submodules`;
    $`git submodule update --init --recursive`;
}
