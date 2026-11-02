import { toApiGatewayJsonSchema } from "@digitraffic/common/dist/utils/api-model";
import { describe, expect, test } from "vitest";
import {
  DirwayFeatureCollectionSchema,
  LocationFeatureCollectionSchema,
  VesselsResponseSchema,
} from "../model/public-api-model.js";

// These checks match the API Gateway model import rules. Breaking them causes
// errors such as "ArrayNode cannot be cast to TextNode" when swagger-joiner
// exports the API documentation (DPO-5134).
function findApiGatewayProblems(value: unknown, path: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findApiGatewayProblems(item, `${path}[${index}]`),
    );
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  const problems: string[] = [];
  const record = value as Record<string, unknown>;

  if ("nullable" in record) {
    problems.push(`${path}: nullable keyword is not accepted`);
  }
  // biome-ignore lint/complexity/useLiteralKeys: Record<string, unknown> requires bracket notation for noPropertyAccessFromIndexSignature
  if (Array.isArray(record["type"])) {
    problems.push(
      // biome-ignore lint/complexity/useLiteralKeys: Record<string, unknown> requires bracket notation for noPropertyAccessFromIndexSignature
      `${path}: type must be a string, not ${JSON.stringify(record["type"])}`,
    );
  }

  for (const [key, child] of Object.entries(record)) {
    problems.push(...findApiGatewayProblems(child, `${path}.${key}`));
  }
  return problems;
}

describe("API Gateway models from public API schemas", () => {
  test.each([
    ["Locations", LocationFeatureCollectionSchema],
    ["Vessels", VesselsResponseSchema],
    ["Dirways", DirwayFeatureCollectionSchema],
  ] as const)("%s model is valid for API Gateway", (_name, zodSchema) => {
    const schema = toApiGatewayJsonSchema(zodSchema);

    expect(findApiGatewayProblems(schema, "$")).toEqual([]);
  });

  test("nullable fields allow null as an alternative", () => {
    const schema = JSON.parse(
      JSON.stringify(toApiGatewayJsonSchema(VesselsResponseSchema)),
    ) as Record<string, unknown>;

    // activities[*].reason is nullable in the Zod schema and must stay
    // nullable in the API Gateway model
    const text = JSON.stringify(schema);
    expect(text).toContain('"type":"null"');
    expect(text).not.toContain('"nullable"');
  });
});
