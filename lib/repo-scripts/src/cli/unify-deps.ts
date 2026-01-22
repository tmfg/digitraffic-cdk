#!/usr/bin/env zx --quiet

import {$, chalk, question} from "zx";
import _ from "lodash";
import fs from "fs-extra";
import async from "async";

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

interface DependencyVersion {
  dependencyName: string;
  version: string;
}

interface Dependencies {
  [k: string]: DependencyVersion | undefined;
}

interface PackageJson {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

async function askVersion(check: RushCheck): Promise<DependencyVersion> {
  console.log(`Dependency: ${chalk.blue(check.dependencyName)}`);

  const versions = _.chain(check.versions)
    .sortBy(({ version }) => version)
    .reverse()
    .value();

  versions.forEach((version) => {
    console.log(`  Version: ${chalk.green(version.version)}`);
    version.projects.forEach((project) => {
      console.log(`    - ${project}`);
    });
  });

  const [left, right] = versions;

  if (!left || !right) {
    throw new Error("Unexpected error: Couldn't get the version");
  }

  if (check.dependencyName.includes("@types/")) {
    // strip ^ and ~ from @types/ dependencies
    left.version = _.trimStart(left.version, "^~");
  }

  let version = await question(
    `Which version to use (${chalk.green(left.version)}/${
      chalk.yellow(right.version)
    })? (${
      chalk.green(
        "[left]",
      )
    }/${chalk.yellow("(r)ight")}/(s)kip/somethingelse): `,
  );

  const answer = version.toLowerCase();

  if (answer === "" || answer === "left" || answer === "l") {
    version = left.version;
  } else if (answer === "skip" || answer === "s") {
    version = "skip";
  } else if (answer === "right" || answer === "r") {
    version = right.version;
  }

  console.log(`Picked: ${chalk.cyan(version)}\n`);

  return { dependencyName: check.dependencyName, version };
}

function groupByDependency(
  dependencyVersions: DependencyVersion[],
): Dependencies {
  return _.chain(dependencyVersions)
    .groupBy("dependencyName")
    .mapValues((items) => _.head(items))
    .value();
}

function updateVersions(
  dependencies: Dependencies,
  packageJson: PackageJson,
): PackageJson {
  return _.mapValues(packageJson, (value, packageJsonKey) => {
    if (
      ["dependencies", "devDependencies", "peerDependencies"].includes(
        packageJsonKey,
      )
    ) {
      return _.mapValues(
        value,
        (version: string, dependencyName: string) => {
          const newDependency = dependencies[dependencyName];

          if (!newDependency || version.includes("workspace")) {
            return version;
          }

          return newDependency.version;
        },
      );
    }
    return value;
  }) as PackageJson;
}

async function main(): Promise<void> {
  const versionsJson: RushCheckResult = await $`rush check --json`.json();
  const rushJson: RushJson = await $`rush list --json`.json();

  const dependencies = await async
    .mapSeries(versionsJson.mismatchedVersions, askVersion)
    .then((deps) => deps.filter((d) => d.version !== "skip"))
    .then(groupByDependency);

  await async.eachSeries(
    rushJson.projects,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (project) => {
      const packageJsonPath = `${project.fullPath}/package.json`;
      const packageJson =
        (await fs.readJson(packageJsonPath)) as unknown as PackageJson;
      const updated = updateVersions(dependencies, packageJson);
      const output = `${JSON.stringify(updated, null, 2)}\n`;
      await fs.writeFile(packageJsonPath, output);
    },
  );
}

main().catch((e) => console.error(e));
