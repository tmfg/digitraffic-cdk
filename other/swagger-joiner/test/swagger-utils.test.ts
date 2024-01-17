import {
    mergeApiDescriptions,
    withoutMethods,
    withoutSecurity,
    withDeprecations
} from "../lib/swagger-utils";
import {
    getDeprecatedPathWithHeaders,
    getDeprecatedPathWithRemovalText,
    getOpenapiDescriptionWithPaths,
    getPathWithSecurity,
    getSupportedPath
} from "./testdata";
import { openapiSchema } from "../lib/model/openapi-schema";
import * as digitrafficOpenApiJson from "./resources/digitraffic-road-test.json";

/* eslint-disable @typescript-eslint/no-non-null-assertion --
 * Assertions are absolutely fine in tests.
 */

describe("swagger-utils", () => {
    test("mergeApiDescriptions", () => {
        const appApi = getOpenapiDescriptionWithPaths({ "/app/path": {} });
        const apiGwApi1 = getOpenapiDescriptionWithPaths({
            "/apigw1/path": {}
        });
        const apiGwApi2 = getOpenapiDescriptionWithPaths({
            "/apigw2/path": {}
        });

        expect(mergeApiDescriptions([appApi, apiGwApi1, apiGwApi2])).toMatchObject(
            getOpenapiDescriptionWithPaths({
                "/app/path": {},
                "/apigw1/path": {},
                "/apigw2/path": {}
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
            ...getDeprecatedPathWithRemovalText(path3)
        });

        // deprecated field not set in test data
        expect(apiDescription.paths[path1].get!.deprecated).toBe(undefined);
        expect(apiDescription.paths[path2].get!.deprecated).toBe(undefined);
        expect(apiDescription.paths[path3].get!.deprecated).toBe(undefined);

        // set fields
        apiDescription.paths = withDeprecations(apiDescription.paths);

        // openapi description is still valid
        expect(openapiSchema.parse(apiDescription)).toBeTruthy();

        // deprecated field is set where required
        expect(apiDescription.paths[path1].get!.deprecated).toBe(undefined);
        expect(apiDescription.paths[path2].get!.deprecated).toBe(true);
        expect(apiDescription.paths[path3].get!.deprecated).toBe(true);
    });

    test("removeSecurityFromPaths", () => {
        const path1 = "/api/one";
        const path2 = "/api/two";

        const api = getOpenapiDescriptionWithPaths({
            ...getSupportedPath(path1),
            ...getPathWithSecurity(path2)
        });

        const filteredPaths = withoutSecurity(api.paths);

        expect(api.paths[path1].get!.security).not.toBeDefined();
        expect(api.paths[path2].get!.security).toBeDefined();
        expect(filteredPaths[path1].get!.security).not.toBeDefined();
        expect(filteredPaths[path2].get!.security).not.toBeDefined();
    });

    test("removeMethodsFromPaths", () => {
        const path1 = "/api/one";
        const path2 = "/api/two";

        const api = getOpenapiDescriptionWithPaths({
            ...getSupportedPath(path1, "get"),
            ...getSupportedPath(path2, "put")
        });

        const filteredPaths = withoutMethods(api.paths, (method) => method === "put");

        expect(api.paths[path1].get).toBeDefined();
        expect(api.paths[path2].put).toBeDefined();
        expect(filteredPaths[path1].get).toBeDefined();
        expect(filteredPaths[path2].put).not.toBeDefined();
    });

    test("OpenApi schema parses actual json", () => {
        // Sanity check on the openapiSchema accepts the actual json we output.

        // Throws error on failure indicating what is wrong.
        openapiSchema.parse(digitrafficOpenApiJson);
    });
});
