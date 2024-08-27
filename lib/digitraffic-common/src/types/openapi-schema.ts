import { z } from "zod";

export const serverObject = z.object({
    url: z.string(),
    description: z.string().optional(),
    variables: z.record(z.unknown()).optional(),
});

export const parameterObject = z.object({
    name: z.string(),
    in: z.enum(["query", "header", "path", "cookie"]),
    description: z.string().optional(),
    required: z.boolean().optional(),
    deprecated: z.boolean().optional(),
    allowEmptyValue: z.boolean().optional(),
    style: z
        .enum(["matrix", "label", "form", "simple", "spaceDelimited", "pipeDelimited", "deepObject"])
        .optional(),
    explode: z.string().optional(),
    allowReserved: z.boolean().optional(),
    schema: z.unknown().optional(),
    example: z.unknown().optional(),
    examples: z.record(z.unknown()).optional(),
    content: z.record(z.unknown()).optional(),
});

export const referenceObject = z.object({
    $ref: z.string(),
    summary: z.string().optional(),
    description: z.string().optional(),
});

export const openapiOperation = z
    .object({
        tags: z.array(z.string()),
        summary: z.string(),
        description: z.string(),
        externalDocs: z.unknown(),
        operationId: z.string(),
        parameters: z.array(parameterObject.or(referenceObject)),
        requestBody: z.unknown(),
        responses: z.unknown(),
        callbacks: z.unknown(),
        deprecated: z.boolean(),
        security: z.array(z.record(z.array(z.string()))),
        servers: z.array(z.unknown()),
    })
    .partial();

// Path items have some fixed fields but also allow for extended fields starting with "x-".
//export const openapiPathItem = z.record(openapiOperation.or(serverObject).or(parameterObject));

export const openapiPathItem = z
    .object({
        summary: z.string(),
        description: z.string(),
        get: openapiOperation,
        put: openapiOperation,
        post: openapiOperation,
        delete: openapiOperation,
        options: openapiOperation,
        head: openapiOperation,
        patch: openapiOperation,
        trace: openapiOperation,
        servers: serverObject,
        parameters: z.array(parameterObject),
    })
    .partial();

export const openapiSchema = z
    .object({
        openapi: z.string().regex(new RegExp("^3\\.0\\.\\d(-.+)?$")),
        info: z
            .object({
                title: z.string(),
                description: z.string().optional(),
                termsOfService: z.string().optional(),
                contact: z
                    .object({
                        name: z.string().optional(),
                        url: z.string().optional(),
                        email: z.string().email().optional(),
                    })
                    .strict()
                    .optional(),
                license: z.object({ name: z.string(), url: z.string().optional() }).strict().optional(),
                version: z.string(),
            })
            .strict(),
        externalDocs: z.object({ description: z.string().optional(), url: z.string() }).strict().optional(),
        servers: z
            .array(
                z
                    .object({
                        url: z.string(),
                        description: z.string().optional(),
                        variables: z
                            .record(
                                z
                                    .object({
                                        enum: z.array(z.string()).optional(),
                                        default: z.string(),
                                        description: z.string().optional(),
                                    })
                                    .strict(),
                            )
                            .optional(),
                    })
                    .strict(),
            )
            .optional(),
        security: z.array(z.record(z.array(z.string()))).optional(),
        tags: z
            .array(
                z
                    .object({
                        name: z.string(),
                        description: z.string().optional(),
                        externalDocs: z
                            .object({
                                description: z.string().optional(),
                                url: z.string(),
                            })
                            .strict()
                            .optional(),
                    })
                    .strict(),
            )
            .optional(),
        paths: z.record(openapiPathItem),
        components: z
            .object({
                schemas: z.record(z.any()).optional(),
                responses: z.record(z.any()).optional(),
                parameters: z.record(z.any()).optional(),
                examples: z.record(z.any()).optional(),
                requestBodies: z.record(z.any()).optional(),
                headers: z.record(z.any()).optional(),
                securitySchemes: z.record(z.any()).optional(),
                links: z.record(z.any()).optional(),
                callbacks: z.record(z.any()).optional(),
            })
            .strict()
            .optional(),
    })
    .describe(
        "The description of OpenAPI v3.0.x documents, as defined by https://spec.openapis.org/oas/v3.0.3",
    );

export type OpenApiOperation = z.infer<typeof openapiOperation>;
export type OpenApiPathItem = z.infer<typeof openapiPathItem>;
export type OpenApiSchema = z.infer<typeof openapiSchema>;
