#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

function setup(): void {
  const isGitRepo: boolean = existsSync(".git");
  if (isGitRepo) {
    console.info(
      "[setup-digitraffic-common.ts] 🕵 Standalone repo detected — 🛠 Installing lefthook...",
    );
    execSync("npx lefthook install", { stdio: "inherit" });
    console.info("[setup-digitraffic-common.ts] 💪 Lefthook installed.");
  } else {
    console.info("🔍 Subtree detected — skipping Lefthook installation.");
  }
  console.info(
    "[setup-digitraffic-common.ts] 🏁 Setup finished! Go build something amazing.",
  );
}

setup();
