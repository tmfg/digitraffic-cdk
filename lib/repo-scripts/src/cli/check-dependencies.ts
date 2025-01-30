#!/usr/bin/env node

import { globby } from "globby";
import fs from "fs-extra";
import chalk from "chalk";

interface PackageJson {
  dependencies: Record<string, string>;
}

function getPackageJsons(): Promise<string[]> {
  return globby([
    "aviation/*/package.json",
    "marine/*/package.json",
    "lib/*/package.json",
    "other/*/package.json",
    "rail/*/package.json",
    "road/*/package.json",
    "tools/*/package.json",
  ]);
}

function checkDependencies(packageJson: PackageJson): [string, string][] {
  if ("dependencies" in packageJson) {
    const dependencies = Object.entries(packageJson.dependencies);
    return dependencies.filter(([key]) => key.startsWith("@types/"));
  }
  return [];
}

async function run(): Promise<void> {
  const packages = await getPackageJsons();
  const dependencies = await Promise.all(
    packages.map(async (file) => ({
      project: file.replace("/package.json", ""),
      items: checkDependencies((await fs.readJson(file)) as PackageJson),
    })),
  );
  const results = dependencies.filter(({ items }) => items.length !== 0);
  results.forEach(({ project, items }) => {
    console.log(
      `Project: ${
        chalk.bold(project)
      } has declared following as dependency instead of devDependency:`,
    );
    items.forEach(([key]) => console.log(`- ${key}`));
  });

  if (results.length > 0) {
    console.log(chalk.red("Check above errors"));
    process.exitCode = 1;
  }
}

run().catch((error: Error) => console.error(error));
