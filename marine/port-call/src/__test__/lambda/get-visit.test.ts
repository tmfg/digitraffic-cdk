import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { assertVisitCount, dbTestBase, mockProxyAndSecretHolder } from "../db-testutil.js";
import { ExpectResponse } from "@digitraffic-cdk/testing";
import type { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { updateAndExpect } from "../service/visits-service.test.js";
import { createTestVisit } from "../testdata.js";

// eslint-disable-next-line dot-notation
process.env["SECRET_ID"] = "";

mockProxyAndSecretHolder();

async function getResponseFromLambda(visitId: string): Promise<LambdaResponse> {
    const { handler } = await import("../../lambda/get-visit/get-visit.js");

    return await handler({
        visitId
    });
}

describe(
    "get-visit-lambda-tests",
    dbTestBase((db: DTDatabase) => {
        test("not found", async () => {
            const response = await getResponseFromLambda("v1");

            ExpectResponse.notFound(response);
        });

        test("one visit", async () => {
            const testVisit = createTestVisit();
            await updateAndExpect([testVisit], 1);
            await assertVisitCount(db, 1);
            
            const response = await getResponseFromLambda(testVisit.visitId);
            ExpectResponse.ok(response).expectJson({
                "ata": null,
                "atd": null,
                "eta": testVisit.portCall.voyageInformation.estimatedArrivalDateTime.toISOString(),
                "etd": testVisit.portCall.voyageInformation.estimatedDepartureDateTime!.toISOString(),
                "port_locode": testVisit.portCall.voyageInformation.portIdentification,
                "status": testVisit.portCall.portCallStatus.status,
                "update_time": testVisit.latestUpdateTime.toISOString(),
                "vessel_id": testVisit.portCall.vesselInformation.identification,
                "vessel_name": testVisit.portCall.vesselInformation.name,
                "visit_id": testVisit.visitId,
            });
        });
    })
);
