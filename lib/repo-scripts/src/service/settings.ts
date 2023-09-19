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
    try {
        return (await fs.readJson(`common/config/repo/${name}.${type}.json`)) as object;
    } catch (_) {
        return {};
    }
}

export async function getSettings(): Promise<Settings> {
    const defaultSettings = await getRepoFile("settings", "default");
    const overrideSettings = await getRepoFile("settings", "override");
    return renameKeys(_.merge(defaultSettings, overrideSettings)) as Settings;
}
