import { APIGatewayClient } from "@aws-sdk/client-api-gateway";
import type { OpenApiSchema } from "@digitraffic/common/dist/types/openapi-schema";
import { get } from "es-toolkit/compat";
import { afterEach, describe, expect, test, vi } from "vitest";

const mockSend = vi.fn(() => Promise.resolve({ items: [] }));
vi.spyOn(APIGatewayClient.prototype, "send").mockImplementation(mockSend);

import {
  createDocumentationVersion,
  exportSwaggerApi,
  fixApiGatewayNullable,
  getDocumentationVersion,
} from "../apigw-utils.js";

const TEST_API_ID = "some-api-id" as const;

function expectAGCall(expectedClass: string, expected: unknown): void {
  expect(mockSend).toHaveBeenCalled();

  const parameterClass = get(mockSend.mock.calls[0], "[0].constructor.name");
  const input = get(mockSend.mock.calls[0], "[0].input");

  expect(parameterClass).toEqual(expectedClass);
  expect(input).toEqual(expected);
}

interface Oas30Schema {
  type?: string;
  nullable?: boolean;
  enum?: unknown[];
  minLength?: number;
  anyOf?: Oas30Schema[];
  oneOf?: Oas30Schema[];
}

/**
 * OpenAPI 3.0 semantics for null: nullable: true allows null only next to an explicit type,
 * an enum must list null explicitly (also without a type), anyOf needs at least one and
 * oneOf exactly one match.
 */
function acceptsNullOas30(schema: Oas30Schema): boolean {
  if (schema.type !== undefined) {
    return (
      schema.nullable === true && (!schema.enum || schema.enum.includes(null))
    );
  }
  if (schema.enum) {
    return schema.enum.includes(null);
  }
  if (schema.anyOf) {
    return schema.anyOf.some(acceptsNullOas30);
  }
  if (schema.oneOf) {
    return schema.oneOf.filter(acceptsNullOas30).length === 1;
  }
  return false;
}

describe("apigw-utils", () => {
  afterEach(() => {
    mockSend.mockClear();
  });

  test("exportSwaggerApi", async () => {
    await exportSwaggerApi(TEST_API_ID);

    expectAGCall("GetExportCommand", {
      exportType: "oas30",
      restApiId: TEST_API_ID,
      stageName: "prod",
    });
  });

  test("getDocumentationVersion", async () => {
    await getDocumentationVersion(TEST_API_ID, new APIGatewayClient());

    expectAGCall("GetDocumentationVersionsCommand", {
      limit: 500,
      restApiId: TEST_API_ID,
    });
  });

  test("createDocumentationVersion", async () => {
    const docVersion = "42";

    await createDocumentationVersion(
      TEST_API_ID,
      docVersion,
      new APIGatewayClient(),
    );

    expectAGCall("CreateDocumentationVersionCommand", {
      restApiId: TEST_API_ID,
      stageName: "prod",
      documentationVersion: "42",
    });
  });

  describe("fixApiGatewayNullable", () => {
    test.each(["anyOf", "oneOf"])(
      "converts %s [schema, null] to nullable schema",
      (key) => {
        const schema = {
          properties: {
            name: { description: "Name", [key]: [{ type: "string" }, null] },
          },
        };

        fixApiGatewayNullable(schema as unknown as OpenApiSchema);

        expect(schema.properties.name).toEqual({
          description: "Name",
          type: "string",
          nullable: true,
        });
      },
    );

    test.each(["anyOf", "oneOf"])(
      "adds null to the enum of a single enum alternative in %s",
      (key) => {
        const schema = {
          [key]: [{ type: "string", enum: ["A"] }, null],
        };

        fixApiGatewayNullable(schema as unknown as OpenApiSchema);

        expect(schema).toEqual({
          type: "string",
          enum: ["A", null],
          nullable: true,
        });
        expect(acceptsNullOas30(schema as Oas30Schema)).toBe(true);
      },
    );

    test("converts nested and array items", () => {
      const schema = {
        items: [{ oneOf: [{ type: "integer", minimum: 1 }, null] }],
      };

      fixApiGatewayNullable(schema as unknown as OpenApiSchema);

      expect(schema.items[0]).toEqual({
        type: "integer",
        minimum: 1,
        nullable: true,
      });
    });

    test("keeps all alternatives and adds nullable when there are several non-null alternatives", () => {
      const schema = {
        properties: {
          parkingType: {
            description: "Open enum",
            anyOf: [
              { type: "string", enum: ["ON_STREET", "PARKING_LOT"] },
              { type: "string", minLength: 1 },
              null,
            ],
          },
        },
      };

      fixApiGatewayNullable(schema as unknown as OpenApiSchema);

      expect(schema.properties.parkingType).toEqual({
        description: "Open enum",
        anyOf: [
          { type: "string", enum: ["ON_STREET", "PARKING_LOT"] },
          { type: "string", minLength: 1, nullable: true },
        ],
      });
    });

    test("result allows null by OpenAPI 3.0 rules for open enum", () => {
      const schema = {
        anyOf: [
          { type: "string", enum: ["ON_STREET", "PARKING_LOT"] },
          { type: "string", minLength: 1 },
          null,
        ],
      };

      fixApiGatewayNullable(schema as unknown as OpenApiSchema);

      expect(acceptsNullOas30(schema as Oas30Schema)).toBe(true);
      // nullable only on the list, without type, does not allow null
      expect(
        acceptsNullOas30({
          anyOf: [
            { type: "string", enum: ["A"] },
            { type: "string", minLength: 1 },
          ],
          nullable: true,
        }),
      ).toBe(false);
    });

    test("oneOf accepts null in exactly one alternative", () => {
      const schema = { oneOf: [{ type: "string" }, { type: "number" }, null] };

      fixApiGatewayNullable(schema as unknown as OpenApiSchema);

      expect(schema).toEqual({
        oneOf: [{ type: "string", nullable: true }, { type: "number" }],
      });
      expect(acceptsNullOas30(schema as Oas30Schema)).toBe(true);
    });

    test("adds null to the enum when all alternatives are enums", () => {
      const schema = {
        anyOf: [
          { type: "string", enum: ["A"] },
          { type: "string", enum: ["B"] },
          null,
        ],
      };

      fixApiGatewayNullable(schema as unknown as OpenApiSchema);

      expect(schema).toEqual({
        anyOf: [
          { type: "string", enum: ["A", null], nullable: true },
          { type: "string", enum: ["B"] },
        ],
      });
      expect(acceptsNullOas30(schema as Oas30Schema)).toBe(true);
    });

    test("adds null to the first enum when alternatives have no type", () => {
      const schema = { oneOf: [{ enum: ["A"] }, { enum: ["B"] }, null] };

      fixApiGatewayNullable(schema as unknown as OpenApiSchema);

      expect(schema).toEqual({
        oneOf: [{ enum: ["A", null] }, { enum: ["B"] }],
      });
      expect(acceptsNullOas30(schema as Oas30Schema)).toBe(true);
    });

    test("prefers the first typed alternative without enum", () => {
      const schema = { anyOf: [{ type: "object" }, { $ref: "#/x" }, null] };

      fixApiGatewayNullable(schema as unknown as OpenApiSchema);

      expect(schema).toEqual({
        anyOf: [{ type: "object", nullable: true }, { $ref: "#/x" }],
      });
    });

    test("adds a null-only alternative when no alternative can accept null", () => {
      const schema = { anyOf: [{ minLength: 1 }, { pattern: "a" }, null] };

      fixApiGatewayNullable(schema as unknown as OpenApiSchema);

      expect(schema).toEqual({
        anyOf: [{ minLength: 1 }, { pattern: "a" }, { enum: [null] }],
      });
      expect(acceptsNullOas30(schema as Oas30Schema)).toBe(true);
    });

    test("leaves lists without null untouched", () => {
      const schema = {
        anyOf: [{ type: "string" }, { type: "number" }],
      };

      fixApiGatewayNullable(schema as unknown as OpenApiSchema);

      expect(schema).toEqual({
        anyOf: [{ type: "string" }, { type: "number" }],
      });
    });
  });
});
