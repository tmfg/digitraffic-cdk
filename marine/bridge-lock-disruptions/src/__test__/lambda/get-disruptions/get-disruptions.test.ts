// biome-ignore lint/complexity/useLiteralKeys: Indexed access
process.env["SECRET_ID"] = "Test";

import { describe, expect, test, vi } from "vitest";

const { handler } = await import(
  "../../../lambda/get-disruptions/get-disruptions.js"
);
const { newDisruption } = await import("../../testdata.js");
const { dbTestBase, insertDisruption } = await import("../../db-testutil.js");

import type { FeatureCollection } from "geojson";

const { ProxyHolder } = await import(
  "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder"
);

describe(
  "lambda-get-disruptions",
  dbTestBase((db) => {
    vi.spyOn(ProxyHolder.prototype, "setCredentials").mockReturnValueOnce(
      Promise.resolve(),
    );

    test("Get disruptions", async () => {
      const disruptions = Array.from({
        length: Math.floor(Math.random() * 10),
      }).map(() => {
        return newDisruption();
      });
      await insertDisruption(db, disruptions);

      const response = await handler();
      const responseFeatureCollection = JSON.parse(
        Buffer.from(response.body, "base64").toString(),
      ) as FeatureCollection;

      expect(responseFeatureCollection.features.length).toBe(
        disruptions.length,
      );
    });
  }),
);
