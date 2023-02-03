import {
    mergeApiDescriptions,
    setDeprecatedPerMethod,
} from "../lib/swagger-utils";
import {
    getDeprecatedPathWithHeaders,
    getDeprecatedPathWithRemovalText,
    getOpenapiDescriptionWithPaths,
    getSupportedPath,
} from "./testdata";
import { openapiSchema } from "../lib/model/openapi-schema";

describe("swagger-utils", () => {
    test("mergeApiDescriptions", () => {
        const appApi = getOpenapiDescriptionWithPaths({ "/app/path": {} });
        const apiGwApi1 = getOpenapiDescriptionWithPaths({
            "/apigw1/path": {},
        });
        const apiGwApi2 = getOpenapiDescriptionWithPaths({
            "/apigw2/path": {},
        });

        expect(
            mergeApiDescriptions([appApi, apiGwApi1, apiGwApi2])
        ).toMatchObject(
            getOpenapiDescriptionWithPaths({
                "/app/path": {},
                "/apigw1/path": {},
                "/apigw2/path": {},
            })
        );
    });

    test("setDeprecatedPerMethod", () => {
        const path1 = "/api/foo/v1/bar";
        const path2 = "/api/v2/foo/bar";
        const path3 = "/api/v3/foo/bar";

        const apiDescription = getOpenapiDescriptionWithPaths({
            ...getSupportedPath(path1),
            ...getDeprecatedPathWithHeaders(path2),
            ...getDeprecatedPathWithRemovalText(path3),
        });

        // deprecated field not set in test data
        expect("deprecated" in apiDescription.paths[path1]["get"]).toBe(false);
        expect("deprecated" in apiDescription.paths[path2]["get"]).toBe(false);
        expect("deprecated" in apiDescription.paths[path3]["get"]).toBe(false);

        // set fields
        setDeprecatedPerMethod(apiDescription);

        // openapi description is still valid
        expect(openapiSchema.parse(apiDescription)).toBeTruthy();

        // deprecated field is set where required
        expect("deprecated" in apiDescription.paths[path1]["get"]).toBe(false);
        expect("deprecated" in apiDescription.paths[path2]["get"]).toBe(true);
        expect("deprecated" in apiDescription.paths[path3]["get"]).toBe(true);

        expect(apiDescription.paths[path2]["get"]["deprecated"]).toBe(true);
        expect(apiDescription.paths[path3]["get"]["deprecated"]).toBe(true);
    });
});
