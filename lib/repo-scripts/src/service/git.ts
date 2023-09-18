/* eslint-disable no-unused-expressions */
import type { GitSubmodule } from "./settings";
import fs from "fs-extra";
import { $, echo, within, cd } from "zx";
import * as Settings from "../service/settings";
import { ValueOf, isValue } from "./core";
import _ from "lodash";

type GitSubmoduleStatusState = " " | "+" | "-" | "U";

const gitSubmoduleStatuses = {
    " ": "initialized",
    "-": "uninitialized",
    "+": "checked out",
    U: "merge conflict"
} as const satisfies Record<GitSubmoduleStatusState, string>;

type GitSubmoduleRepoStatuses = ValueOf<typeof gitSubmoduleStatuses>;

interface GitRemote {
    readonly remoteName: string;
    readonly remoteUrl: string;
    readonly operation: string;
}

interface GitSubmoduleStatus {
    readonly status: GitSubmoduleRepoStatuses;
    readonly sha: string;
    readonly path: string;
    readonly tag?: string;
}

interface GitSubmoduleState extends GitSubmoduleStatus {
    readonly url: string;
}

async function getSubmoduleStatus(): Promise<GitSubmoduleStatus[]> {
    const { stdout } = await $`git submodule status`;
    const submoduleStrings = stdout.split("\n");
    return _.chain(submoduleStrings)
        .map(
            (str) =>
                /^(?<status>[ +-U])(?<sha>[^ ]+) (?<path>[^ ]+)(?: \((?<tag>[^)]+)\))?$/.exec(str)?.groups
        )
        .filter(isValue)
        .map((statusGroup) => {
            // eslint-disable-next-line dot-notation
            const statusOrig = statusGroup["status"] as GitSubmoduleStatusState;
            return { ...statusGroup, status: gitSubmoduleStatuses[statusOrig] } as GitSubmoduleStatus;
        })
        .value();
}

function getRemote(status: GitSubmoduleStatus): Promise<string> {
    return within(async () => {
        cd(status.path);

        const { stdout } = await $`git remote -v`;
        return _.chain(stdout.split("\n"))
            .map(
                (str): GitRemote | undefined =>
                    /^(?<remoteName>[^ ]+)\s+(?<remoteUrl>[^ ]+)\s\((?<operation>[^)]+)\)$/.exec(str)
                        ?.groups as unknown as GitRemote | undefined
            )
            .filter(isValue)
            .filter((remote) => remote.remoteName === "origin")
            .map((remote) => remote.remoteUrl)
            .head()
            .value();
    });
}

async function getSubmoduleStatuses(): Promise<GitSubmoduleState[]> {
    const submoduleStatus = await getSubmoduleStatus();
    return await Promise.all(
        submoduleStatus.map(async (status) => ({ ...status, url: await getRemote(status) }))
    );
}

function createSubmoduleString({ path, url }: GitSubmodule): string {
    return `
[submodule "${path}"]
	path = ${path}
	url = ${url}
`.trim();
}

function createSubmoduleFile(modules: GitSubmodule[]): string {
    return modules.map(createSubmoduleString).join("\n");
}

export async function init(): Promise<void> {
    const { gitSubmodules } = await Settings.getSettings();

    echo`Updating .gitmodules file.`;
    const submoduleContent = createSubmoduleFile(gitSubmodules);
    await fs.writeFile(".gitmodules", submoduleContent, { encoding: "utf-8" });

    const moduleStatuses = await getSubmoduleStatuses();
    console.log(JSON.stringify({ gitSubmodules, moduleStatuses }, null, 2));

    echo`Initializing git submodule`;
    await $`git submodule update --init --recursive`;
}

export async function deinit(): Promise<void> {}
