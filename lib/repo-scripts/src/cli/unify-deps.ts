#!/usr/bin/env zx --quiet

import { $, question } from "zx";
import _ from "lodash";

interface RushVersion {
    version: string;
    projects: string[];
}

interface RushCheck {
    dependencyName: string;
    versions: RushVersion[];
}

interface RushCheckResult {
    mismatchedVersions: RushCheck[];
}

interface RushProject {
    name: string;
    version: string;
    path: string;
    fullPath: string;
    shouldPublish: boolean;
    tags: string[];
}

interface RushJson {
    projects: RushProject[];
}

async function askVersion(check: RushCheck): Promise<string> {
    console.log(`Dependency: ${check.dependencyName}`);

    const versions = _.chain(check.versions)
        .sortBy(({ version }) => version)
        .reverse()
        .value();

    versions.forEach((version) => {
        console.log(`  Version: ${version.version}`);
        version.projects.forEach((project) => {
            console.log(`    - ${project}`);
        });
    });

    const [left, right] = versions;

    if (!left || !right) {
        throw new Error("Unexpected error: Couldn't get the version");
    }

    const version = await question("Which version to use? ([left]/right/somethingelse)");

    if (version === "" || version === "left") {
        return left.version;
    } else if (version === "right") {
        return right.version;
    } else {
        return version;
    }
}

function pickVersion() {}

async function main(): Promise<void> {
    const versionsJson: RushCheckResult = await $`rush check --json`.json();
    const rushJson: RushJson = await $`rush list --json`.json();

    for (const mismatch of versionsJson.mismatchedVersions) {
        const version = await askVersion(mismatch);
    }
}

main().catch((e) => console.error(e));
