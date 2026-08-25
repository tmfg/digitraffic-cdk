import { readFileSync } from "node:fs";

// Non-blocking reminder shown before local `cdk deploy`: warns if the real
// CloudFront Functions runtime check (rushx test:runtime, see
// src/__test__/lambda/cloudfront-function-runtime.test.ts) hasn't been run
// recently, since a passing `rushx test` alone doesn't prove the deployed
// JS bundles actually run in the CloudFront JS runtime.
const STAMP_FILE = "dist/.runtime-test-last-run";
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

function warn(message) {
  console.warn(`\n⚠️  ${message}\n`);
}

let lastRun;
try {
  lastRun = Number(readFileSync(STAMP_FILE, "utf-8"));
} catch {
  warn(
    "CloudFront Function runtime test has not been run.\n" +
      "   export AWS_PROFILE=profile-name\n" +
      "   rushx test:runtime",
  );
  process.exit(0);
}

const ageMs = Date.now() - lastRun;
if (!Number.isFinite(lastRun) || ageMs > MAX_AGE_MS) {
  const ageHours = Number.isFinite(lastRun)
    ? Math.round(ageMs / (60 * 60 * 1000))
    : undefined;
  warn(
    `CloudFront Function runtime test was last run ${ageHours ?? "an unknown number of"}h ago.\n` +
      "   export AWS_PROFILE=profile-name\n" +
      "   rushx test:runtime",
  );
}
