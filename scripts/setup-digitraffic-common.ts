#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function setup(): void {
  const gitDir = join(process.cwd(), ".git");
  if (existsSync(gitDir)) {
    console.info(
      "[setup-digitraffic-common.ts] 🕵 Standalone repo detected — 🛠 Installing lefthook...",
    );
    // Install Lefthook temporarily without saving to package.json
    execSync("npx --yes lefthook install", { stdio: "inherit" });
    console.info("[setup-digitraffic-common.ts] 💪 Lefthook installed.");
  } else {
    console.info("🔍 Subtree detected — skipping Lefthook installation.");
  }
  console.info(
    "[setup-digitraffic-common.ts] 🏁 Setup finished! Go build something amazing.",
  );
}

setup();
