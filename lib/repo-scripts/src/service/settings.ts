import _ from "lodash";
import fs from "fs-extra";

export interface Module {
    path: string;
    url: string;
}

export interface Settings {
    "git-submodules": Module[];
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
    return _.merge(defaultSettings, overrideSettings) as Settings;
}
