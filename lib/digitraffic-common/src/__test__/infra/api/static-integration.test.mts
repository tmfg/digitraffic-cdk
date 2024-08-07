import { DigitrafficStaticIntegration } from "../../../aws/infra/api/static-integration.mjs";
import { MediaType } from "../../../aws/types/mediatypes.mjs";

describe("response tests", () => {
    it("createIntegrationResponse works", () => {
        const integrationResponse = DigitrafficStaticIntegration.createIntegrationResponse(
            "FakeResource",
            MediaType.APPLICATION_JSON,
            { "test-header": "test-value" },
        );
        expect(integrationResponse).toEqual({
            responseParameters: {
                "method.response.header.test-header": "'test-value'",
            },
            responseTemplates: {
                "application/json": "FakeResource",
            },
            statusCode: "200",
        });
    });

    it("createMethodResponse works", () => {
        const methodResponse = DigitrafficStaticIntegration.createMethodResponse({
            "test-header": "test-value",
        });
        expect(methodResponse).toEqual({
            responseParameters: {
                "method.response.header.test-header": true,
            },
            statusCode: "200",
        });
    });
});
