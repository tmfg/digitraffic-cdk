#!/usr/bin/env node

import { Command } from "commander";
import * as Git from "../service/git.js";

const program = new Command();

program
    .name("git-submodule-extra")
    .description("CLI tool to manage submodules in Digitraffic monorepositories");

program
    .command("init")
    .description("Initialize submodules")
    .action(() => Git.init().catch((error: Error) => console.error(error)));

program
    .command("deinit")
    .description("Deinitialize submodules")
    .action(() => Git.deinit().catch((error: Error) => console.error(error)));

program.parse();
