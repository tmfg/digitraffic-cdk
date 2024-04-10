import {
    mergeApiDescriptions,
    withoutMethods,
    withoutSecurity,
    withDeprecations,
    withoutApisWithoutHttpMethods
} from "../swagger-utils.js";
import {
    getDeprecatedPathWithHeaders,
    getDeprecatedPathWithRemovalText,
    getOpenapiDescriptionWithPaths,
    getPathWithSecurity,
    getSupportedPath
} from "./testdata.js";
import { openapiSchema } from "../model/openapi-schema.js";
import { TEST } from "./resources/digitraffic-road-test.js";

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
        expect(apiDescription.paths[path1]!.get!.deprecated).toBe(undefined);
        expect(apiDescription.paths[path2]!.get!.deprecated).toBe(undefined);
        expect(apiDescription.paths[path3]!.get!.deprecated).toBe(undefined);

        // set fields
        apiDescription.paths = withDeprecations(apiDescription.paths);

        // openapi description is still valid
        expect(openapiSchema.parse(apiDescription)).toBeTruthy();

        // deprecated field is set where required
        expect(apiDescription.paths[path1]!.get!.deprecated).toBe(undefined);
        expect(apiDescription.paths[path2]!.get!.deprecated).toBe(true);
        expect(apiDescription.paths[path3]!.get!.deprecated).toBe(true);
    });

    test("removeSecurityFromPaths", () => {
        const path1 = "/api/one";
        const path2 = "/api/two";

        const api = getOpenapiDescriptionWithPaths({
            ...getSupportedPath(path1),
            ...getPathWithSecurity(path2)
        });

        const filteredPaths = withoutSecurity(api.paths);

        expect(api.paths[path1]!.get!.security).not.toBeDefined();
        expect(api.paths[path2]!.get!.security).toBeDefined();
        expect(filteredPaths[path1]!.get!.security).not.toBeDefined();
        expect(filteredPaths[path2]!.get!.security).not.toBeDefined();
    });

    test("removeMethodsFromPaths", () => {
        const path1 = "/api/one";
        const path2 = "/api/two";
        const path3 = "/api/three";

        const api = getOpenapiDescriptionWithPaths({
            ...getSupportedPath(path1, ["get"]),
            ...getSupportedPath(path2, ["put"]),
            ...getSupportedPath(path3, ["options", "put"])
        });

        console.log("api:\n" + JSON.stringify(api, null, 2));

        const filteredPaths = withoutMethods(api.paths, (method) => method === "put" || method === "options");
        const filteredApis = withoutApisWithoutHttpMethods(filteredPaths);

        console.log("filteredPaths:\n" + JSON.stringify(filteredPaths, null, 2));
        console.log("filteredApis:\n" + JSON.stringify(filteredApis, null, 2));

        // Initial data
        expect(api.paths[path1]?.get).toBeDefined();
        expect(api.paths[path2]?.put).toBeDefined();
        expect(api.paths[path3]?.options).toBeDefined();
        expect(api.paths[path3]?.put).toBeDefined();

        // Apis after filtered methods should still exists
        expect(filteredPaths[path1]).toBeDefined();
        expect(filteredPaths[path2]).toBeDefined();
        expect(filteredPaths[path3]).toBeDefined();

        // Filtered methods should not exist
        expect(filteredPaths[path1]!.get).toBeDefined();
        expect(filteredPaths[path2]!.put).not.toBeDefined();
        expect(filteredPaths[path3]!.put).not.toBeDefined();
        expect(filteredPaths[path3]!.options).not.toBeDefined();

        // Apis after withoutApisWithoutHttpMethods
        expect(filteredApis[path1]).toBeDefined();
        expect(filteredApis[path2]).not.toBeDefined();
        expect(filteredApis[path3]).not.toBeDefined();

        // Filtered methods should not exist
        expect(filteredApis[path1]?.get).toBeDefined();
        expect(filteredApis[path2]?.put).not.toBeDefined();
        expect(filteredApis[path3]?.put).not.toBeDefined();
        expect(filteredApis[path3]?.options).not.toBeDefined();
    });

    test("OpenApi schema parses actual json", () => {
        // Sanity check on the openapiSchema accepts the actual json we output.

        // Throws error on failure indicating what is wrong.
        const api = openapiSchema.parse(TEST);

        // Need to bypass the type system to check the actual structure of the objects.
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        /* eslint-disable @typescript-eslint/no-unsafe-argument */

        // Check that nothing got accidentally removed.
        const normalizedParsedJson = JSON.parse(JSON.stringify(api));
        const normalizedOriginalJson = JSON.parse(JSON.stringify(TEST));
        delete normalizedOriginalJson.default; // Added by import

        expect(Object.keys(normalizedParsedJson)).toEqual(Object.keys(normalizedOriginalJson));
        expect(normalizedParsedJson).toEqual(normalizedOriginalJson);

        /* eslint-enable */
    });
});
