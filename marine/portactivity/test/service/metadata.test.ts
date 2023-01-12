import { dbTestBase, insert } from "../db-testutil";
import { newTimestamp } from "../testdata";
import * as MetadataService from "../../lib/service/metadata";
import { PREDICTION_SOURCES } from "../../lib/service/metadata";
import { DTDatabase } from "@digitraffic/common/dist/database/database";

describe(
    "LOCODE metadata",
    dbTestBase((db: DTDatabase) => {
        test("findLocodesWithPredictions", async () => {
            const predictedTimestamps = PREDICTION_SOURCES.map((source) =>
                newTimestamp({ source })
            );
            const timestampNoPrediction = newTimestamp();

            await insert(db, predictedTimestamps.concat(timestampNoPrediction));

            const locodes = await MetadataService.getLocodesWithPredictions();

            expect(locodes.length).toBe(predictedTimestamps.length);
            expect(locodes).not.toContain(timestampNoPrediction.location.port);
            predictedTimestamps.forEach((timestamp) =>
                expect(locodes).toContain(timestamp.location.port)
            );
        });
    })
);
