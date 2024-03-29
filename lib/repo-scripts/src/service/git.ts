/* eslint-disable no-unused-expressions */
import type { GitSubmodule } from "./settings.js";
import fs from "fs-extra";
import { $, echo, within, cd } from "zx";
import * as Settings from "../service/settings.js";
import { isValue } from "./core.js";
import type { ValueOf } from "@digitraffic/common/dist/types/util-types.js";
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

export interface GitStatusLine {
    readonly status: string;
    readonly from?: string;
    readonly target: string;
}

interface GitStatusLineLike {
    readonly status: string;
    readonly from?: string;
    readonly fromQ?: string;
    readonly target?: string;
    readonly targetQ?: string;
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
                (line): GitRemote | undefined =>
                    /^(?<remoteName>[^ ]+)\s+(?<remoteUrl>[^ ]+)\s\((?<operation>[^)]+)\)$/.exec(line)
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

export function parseGitStatusLine(line: string): GitStatusLine | undefined {
    const groups =
        /^(?<status>(?:\?\?|\!\!|[A-Z ]{2})) (?:(?:"(?<fromQ>[^"]+)"|(?<from>[^ ]+)) -> )?(?:"(?<targetQ>[^"]+)"|(?<target>[^ ]+))$/.exec(
            line
        )?.groups as unknown as GitStatusLineLike | undefined;

    if (!groups) {
        return undefined;
    }

    const target = (groups.target ?? groups.targetQ) as unknown as string;
    const from = (groups.from ?? groups.fromQ) as unknown as string;

    return {
        status: groups.status,
        target,
        from
    };
}

function createSubmoduleString({ path, url }: GitSubmodule): string {
    return `
[submodule "${path}"]
	path = ${path}
	url = ${url}
`.trim();
}

async function createSubmoduleFile(modules: GitSubmodule[]): Promise<void> {
    const submoduleContent = modules.map(createSubmoduleString).join("\n");
    console.log(submoduleContent);
    await fs.writeFile(".gitmodules", submoduleContent, { encoding: "utf-8" });
}

async function unstageGitModulesFile(): Promise<void> {
    const { stdout } = await $`git status --short`;

    const result: GitStatusLine | undefined = _.chain(stdout.split("\n"))
        .map(parseGitStatusLine)
        .filter(isValue)
        .filter((statusLine) => /\.gitmodules/.test(statusLine.target))
        .head()
        .value();

    if (result) {
        await $`git restore --staged .gitmodules`;
    }
}

async function addMissingSubmodules(
    gitSubmodules: GitSubmodule[],
    moduleStatuses: GitSubmoduleStatus[]
): Promise<void> {
    const addedSubmodules = gitSubmodules.filter((submodule) =>
        moduleStatuses.find((status) => submodule.path === status.path)
    );
    const newSubmodules = _.xorBy(gitSubmodules, addedSubmodules, "path");

    console.log(JSON.stringify(newSubmodules));

    await Promise.all(
        newSubmodules.map((submodule) => $`git submodule add -f ${submodule.url} ${submodule.path}`)
    );

    await unstageGitModulesFile();
}

async function initializeSubmodules(moduleStatuses: GitSubmoduleStatus[]): Promise<void> {
    await Promise.all(
        moduleStatuses.map(async (module) => {
            if (module.status === "uninitialized") {
                await $`git submodule update --init ${module.path}`;
            }
        })
    );
}

async function updateRemotes(
    gitSubmodules: GitSubmodule[],
    moduleStatuses: GitSubmoduleState[]
): Promise<void> {
    await Promise.all(
        gitSubmodules.map(async (gitSubmodule) => {
            const currentStatus = moduleStatuses.find((status) => status.path === gitSubmodule.path);

            if (!currentStatus) {
                console.error(`Couldn't find status for "${gitSubmodule.path}"`);
                return;
            }

            if (currentStatus.url !== gitSubmodule.url) {
                await $`git submodule set-url ${gitSubmodule.path} ${gitSubmodule.url}`;
            }
        })
    );
}

export async function init(): Promise<void> {
    const { gitSubmodules } = await Settings.getSettings();

    echo`Updating .gitmodules file.`;
    await createSubmoduleFile(gitSubmodules);

    const moduleStatuses = await getSubmoduleStatuses();
    console.log(JSON.stringify({ gitSubmodules, moduleStatuses }, null, 2));

    await addMissingSubmodules(gitSubmodules, moduleStatuses);

    await initializeSubmodules(await getSubmoduleStatuses());

    await updateRemotes(gitSubmodules, await getSubmoduleStatuses());
}

export async function deinit(): Promise<void> {}
