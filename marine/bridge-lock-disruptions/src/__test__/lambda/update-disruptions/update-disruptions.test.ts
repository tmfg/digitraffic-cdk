// biome-ignore lint/complexity/useLiteralKeys: nope
process.env["SECRET_ID"] = "Test";

const { handler } = await import(
  "../../../lambda/update-disruptions/update-disruptions.js"
);
const { disruptionFeatures } = await import("../../testdata.js");
const { dbTestBase } = await import("../../db-testutil.js");
const DisruptionsDb = await import("../../../db/disruptions.js");

import type { DTDatabase } from "@digitraffic/common/dist/database/database";

const { ProxyHolder } = await import(
  "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder"
);

import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { mockKyResponse } from "@digitraffic/common/dist/test/mock-ky";
import ky from "ky";
import { describe, expect, test, vi } from "vitest";

const SERVER_PORT = 8089;

const testSecret = {
  url: `http://localhost:${SERVER_PORT}/`,
};
describe(
  "lambda-update-disruptions",
  dbTestBase((db: DTDatabase) => {
    vi.spyOn(ProxyHolder.prototype, "setCredentials").mockReturnValueOnce(
      Promise.resolve(),
    );
    vi.spyOn(SecretHolder.prototype, "get").mockReturnValueOnce(
      Promise.resolve(testSecret),
    );

    test("Update", async () => {
      const features = disruptionFeatures();
      vi.spyOn(ky, "get").mockImplementation(() =>
        mockKyResponse(200, JSON.stringify(features)),
      );

      await handler();
      const disruptions = await DisruptionsDb.findAll(db);
      expect(disruptions.length).toBe(features.features.length);
    });
  }),
);
