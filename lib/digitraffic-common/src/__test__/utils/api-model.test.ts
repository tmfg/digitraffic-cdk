import type { JsonSchema } from "aws-cdk-lib/aws-apigateway";
import { describe, expect, test } from "vitest";
import { z } from "zod";
import {
  convertJsonSchemaNullableToOneOfDeep,
  toApiGatewayJsonSchema,
} from "../../utils/api-model.js";

describe("convertJsonSchemaNullableToOneOfDeep", () => {
  test("does not change a schema without nullable", () => {
    const input = {
      type: "object",
      properties: {
        name: { type: "string", description: "Vessel name" },
        ids: { type: "array", items: { type: "number" } },
        union: { anyOf: [{ type: "string" }, { type: "number" }] },
      },
      required: ["name"],
      additionalProperties: false,
    } as JsonSchema;

    expect(convertJsonSchemaNullableToOneOfDeep(input)).toEqual(input);
  });

  test("converts nullable fields to oneOf", () => {
    const schema = convertJsonSchemaNullableToOneOfDeep({
      type: "object",
      properties: {
        reason: {
          type: "string",
          nullable: true,
          description: "Optional reason",
        },
      },
    } as JsonSchema);

    expect(schema).toEqual({
      type: "object",
      properties: {
        reason: {
          oneOf: [
            { type: "string", description: "Optional reason" },
            { type: "null" },
          ],
        },
      },
    });
  });

  test("converts nested nullable fields", () => {
    const schema = convertJsonSchemaNullableToOneOfDeep({
      type: "array",
      items: {
        type: "object",
        properties: {
          reason: { type: "string", nullable: true },
        },
      },
    } as JsonSchema);

    expect(schema).toEqual({
      type: "array",
      items: {
        type: "object",
        properties: {
          reason: {
            oneOf: [{ type: "string" }, { type: "null" }],
          },
        },
      },
    });
  });

  test("adds null to an existing union", () => {
    const schema = convertJsonSchemaNullableToOneOfDeep({
      anyOf: [{ type: "string" }, { type: "number" }],
      nullable: true,
    } as JsonSchema);

    expect(schema).toEqual({
      anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
    });
  });

  test("keeps null allowed when nullable schema uses allOf", () => {
    // Zod can emit nullable intersections as { nullable: true, allOf: [...] }.
    // anyOf is used instead of oneOf because an allOf alternative could also
    // accept null, and oneOf would then reject it.
    const schema = convertJsonSchemaNullableToOneOfDeep({
      allOf: [{ type: "object" }, { type: "object" }],
      nullable: true,
    } as JsonSchema);

    expect(schema).toEqual({
      anyOf: [
        { allOf: [{ type: "object" }, { type: "object" }] },
        { type: "null" },
      ],
    });
  });

  test("keeps null allowed when nullable schema is only a reference", () => {
    const schema = convertJsonSchemaNullableToOneOfDeep({
      type: "object",
      definitions: {
        Vessel: { type: "object" },
      },
      properties: {
        vessel: { ref: "#/definitions/Vessel", nullable: true },
      },
    } as JsonSchema);

    expect(schema).toEqual({
      type: "object",
      definitions: {
        Vessel: { type: "object" },
      },
      properties: {
        vessel: {
          anyOf: [{ ref: "#/definitions/Vessel" }, { type: "null" }],
        },
      },
    });
  });

  test("keeps null allowed when nullable schema is empty", () => {
    // An empty schema accepts everything, including null. oneOf would reject
    // null because both alternatives match, so anyOf must be used.
    const schema = convertJsonSchemaNullableToOneOfDeep({
      nullable: true,
    } as JsonSchema);

    expect(schema).toEqual({
      anyOf: [{}, { type: "null" }],
    });
  });

  test("keeps a property named nullable", () => {
    // "nullable" here is a field name, not the OpenAPI keyword
    const schema = convertJsonSchemaNullableToOneOfDeep({
      type: "object",
      properties: {
        nullable: { type: "boolean" },
      },
      required: ["nullable"],
    } as JsonSchema);

    expect(schema).toEqual({
      type: "object",
      properties: {
        nullable: { type: "boolean" },
      },
      required: ["nullable"],
    });
  });

  test("keeps literal values such as defaults untouched", () => {
    // The default value is data, not schema. It must not be rewritten.
    const schema = convertJsonSchemaNullableToOneOfDeep({
      type: "object",
      properties: {
        settings: {
          type: "object",
          default: { nullable: true },
        },
      },
    } as JsonSchema);

    expect(schema).toEqual({
      type: "object",
      properties: {
        settings: {
          type: "object",
          default: { nullable: true },
        },
      },
    });
  });

  test("converts nullable inside dependencies schemas", () => {
    const schema = convertJsonSchemaNullableToOneOfDeep({
      type: "object",
      dependencies: {
        // schema dependency: applied when "credit" is present
        credit: {
          properties: {
            billingAddress: { type: "string", nullable: true },
          },
        },
        // property dependency: a plain name list, must stay unchanged
        name: ["firstName"],
      },
    } as JsonSchema);

    expect(schema).toEqual({
      type: "object",
      dependencies: {
        credit: {
          properties: {
            billingAddress: {
              oneOf: [{ type: "string" }, { type: "null" }],
            },
          },
        },
        name: ["firstName"],
      },
    });
  });

  test("keeps definitions resolvable when a nullable root is wrapped", () => {
    // definitions must stay at the root, otherwise "#/definitions/Code"
    // would point to nothing after wrapping
    const schema = convertJsonSchemaNullableToOneOfDeep({
      type: "object",
      definitions: {
        Code: { type: "string", nullable: true },
      },
      properties: {
        code: { ref: "#/definitions/Code" },
      },
      nullable: true,
    } as JsonSchema);

    expect(schema).toEqual({
      definitions: {
        Code: { oneOf: [{ type: "string" }, { type: "null" }] },
      },
      oneOf: [
        {
          type: "object",
          properties: {
            code: { ref: "#/definitions/Code" },
          },
        },
        { type: "null" },
      ],
    });
  });

  test("wraps a nullable anyOf that has sibling constraints", () => {
    // enum applies to the whole schema, so null added inside anyOf alone
    // would still be rejected by it
    const schema = convertJsonSchemaNullableToOneOfDeep({
      anyOf: [{ type: "string" }, { type: "number" }],
      enum: ["a", 1],
      nullable: true,
    } as JsonSchema);

    expect(schema).toEqual({
      anyOf: [
        {
          anyOf: [{ type: "string" }, { type: "number" }],
          enum: ["a", 1],
        },
        { type: "null" },
      ],
    });
  });

  test("removes nullable false from root and nested schemas", () => {
    const schema = convertJsonSchemaNullableToOneOfDeep({
      type: "object",
      nullable: false,
      properties: {
        name: { type: "string", nullable: false },
      },
    } as JsonSchema);

    expect(schema).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
      },
    });
  });

  test("throws when wrapping would break a local reference", () => {
    // "#/properties/..." would point to nothing after wrapping, so the
    // conversion must fail at synth time instead of producing a broken model
    expect(() =>
      convertJsonSchemaNullableToOneOfDeep({
        type: "object",
        nullable: true,
        properties: {
          homeAddress: { type: "object" },
          billingAddress: { ref: "#/properties/homeAddress" },
        },
      } as JsonSchema),
    ).toThrow(/#\/properties\/homeAddress/);
  });

  test("allows definitions references when wrapping", () => {
    expect(() =>
      convertJsonSchemaNullableToOneOfDeep({
        type: "object",
        nullable: true,
        definitions: { Code: { type: "string" } },
        properties: {
          code: { ref: "#/definitions/Code" },
        },
      } as JsonSchema),
    ).not.toThrow();
  });

  test("does not treat references inside literal values as broken", () => {
    // The default value is data. A "ref" inside it is not a schema reference
    // and must not fail the conversion.
    const schema = convertJsonSchemaNullableToOneOfDeep({
      type: "object",
      nullable: true,
      properties: {
        settings: {
          type: "object",
          default: { ref: "#/properties/code" },
        },
      },
    } as JsonSchema);

    expect(schema).toEqual({
      oneOf: [
        {
          type: "object",
          properties: {
            settings: {
              type: "object",
              default: { ref: "#/properties/code" },
            },
          },
        },
        { type: "null" },
      ],
    });
  });

  test("throws when a sibling reference points inside a wrapped schema", () => {
    // The reference target moves under oneOf[0] when address is wrapped,
    // so the pointer would be left dangling
    expect(() =>
      convertJsonSchemaNullableToOneOfDeep({
        type: "object",
        properties: {
          address: {
            type: "object",
            nullable: true,
            properties: { code: { type: "string" } },
          },
          billingCode: { ref: "#/properties/address/properties/code" },
        },
      } as JsonSchema),
    ).toThrow(/#\/properties\/address\/properties\/code/);
  });

  test("throws when a definitions reference points inside a wrapped schema", () => {
    expect(() =>
      convertJsonSchemaNullableToOneOfDeep({
        type: "object",
        definitions: {
          Shortcut: { ref: "#/properties/address/properties/code" },
        },
        properties: {
          address: {
            type: "object",
            nullable: true,
            properties: { code: { type: "string" } },
          },
          link: { ref: "#/definitions/Shortcut" },
        },
      } as JsonSchema),
    ).toThrow(/#\/properties\/address\/properties\/code/);
  });

  test("allows references whose target does not move", () => {
    // address is wrapped, but the reference points to plain, which stays put
    const schema = convertJsonSchemaNullableToOneOfDeep({
      type: "object",
      properties: {
        plain: { type: "string" },
        address: { type: "object", nullable: true },
        copy: { ref: "#/properties/plain" },
      },
    } as JsonSchema);

    expect(schema).toEqual({
      type: "object",
      properties: {
        plain: { type: "string" },
        address: { oneOf: [{ type: "object" }, { type: "null" }] },
        copy: { ref: "#/properties/plain" },
      },
    });
  });

  test("accepts percent-encoded references", () => {
    // "#/definitions/Postal%20Code" is a valid URI fragment pointer to
    // a definition named "Postal Code"
    const schema = {
      type: "object",
      definitions: {
        "Postal Code": { type: "string" },
      },
      properties: {
        code: { ref: "#/definitions/Postal%20Code" },
        name: { type: "string", nullable: true },
      },
    } as JsonSchema;

    expect(() => convertJsonSchemaNullableToOneOfDeep(schema)).not.toThrow();
  });

  test("rejects an array index with a leading zero", () => {
    // "01" is not a valid JSON Pointer array index, so the reference
    // cannot be resolved even though Number("01") is 1
    expect(() =>
      convertJsonSchemaNullableToOneOfDeep({
        type: "object",
        properties: {
          choice: { anyOf: [{ type: "string" }, { type: "number" }] },
          copy: { ref: "#/properties/choice/anyOf/01" },
          name: { type: "string", nullable: true },
        },
      } as JsonSchema),
    ).toThrow(/#\/properties\/choice\/anyOf\/01/);
  });

  test("rejects references to inherited object properties", () => {
    // toString exists on Object.prototype but not in the JSON document
    expect(() =>
      convertJsonSchemaNullableToOneOfDeep({
        type: "object",
        definitions: {},
        properties: {
          bad: { ref: "#/definitions/toString" },
          name: { type: "string", nullable: true },
        },
      } as JsonSchema),
    ).toThrow(/#\/definitions\/toString/);
  });

  test("treats an encoded slash as a separator per RFC 6901", () => {
    // RFC 6901 section 6: the whole fragment is percent-decoded first and
    // then tokenized, so %2F becomes a separator. A slash inside a key must
    // be escaped as ~1 instead.
    expect(() =>
      convertJsonSchemaNullableToOneOfDeep({
        type: "object",
        definitions: {
          "a/b": { type: "string" },
        },
        properties: {
          bad: { ref: "#/definitions/a%2Fb" },
          name: { type: "string", nullable: true },
        },
      } as JsonSchema),
    ).toThrow(/#\/definitions\/a%2Fb/);
  });

  test("resolves a slash in a key escaped as ~1", () => {
    expect(() =>
      convertJsonSchemaNullableToOneOfDeep({
        type: "object",
        definitions: {
          "a/b": { type: "string" },
        },
        properties: {
          good: { ref: "#/definitions/a~1b" },
          name: { type: "string", nullable: true },
        },
      } as JsonSchema),
    ).not.toThrow();
  });

  test("creates an API Gateway schema from Zod", () => {
    const schema = toApiGatewayJsonSchema(
      z.object({
        reason: z.string().nullable(),
        timestamp: z.iso.datetime(),
      }),
    );

    expect(schema).toMatchObject({
      type: "object",
      properties: {
        reason: {
          oneOf: [{ type: "string" }, { type: "null" }],
        },
        timestamp: { type: "string", format: "date-time" },
      },
    });
    expect(schema).not.toHaveProperty("properties.timestamp.pattern");
  });

  test("keeps a property named pattern but removes the pattern keyword", () => {
    const schema = toApiGatewayJsonSchema(
      z.object({
        // a field that happens to be named "pattern"
        pattern: z.string().regex(/^[a-z]+$/),
      }),
    );

    expect(schema).toMatchObject({
      type: "object",
      properties: {
        pattern: { type: "string" },
      },
      required: ["pattern"],
    });
    // the regex keyword itself must not reach API Gateway
    expect(schema).not.toHaveProperty("properties.pattern.pattern");
  });
});
