import _ from "lodash";
import fs from "fs-extra";
import { renameKeys } from "./core.js";

export interface GitSubmodule {
    readonly path: string;
    readonly url: string;
}

export interface Settings {
    readonly gitSubmodules: GitSubmodule[];
}

export type FileType = "default" | "override";

export async function getRepoFile(name: string, type: FileType = "default"): Promise<object> {
    let settingsString: string | undefined;
    const settingsFile = `common/config/repo/${name}.${type}.json`;

    try {
        settingsString = (await fs.readFile(settingsFile)) as unknown as string;
    } catch (_) {
        return {};
    }

    try {
        return JSON.parse(settingsString) as object;
    } catch (_) {
        throw new Error(`Syntax error in: "${settingsFile}".`);
    }
}

export async function getSettings(): Promise<Settings> {
    const defaultSettings = await getRepoFile("settings", "default");
    const overrideSettings = await getRepoFile("settings", "override");
    return renameKeys(_.merge(defaultSettings, overrideSettings)) as Settings;
}
