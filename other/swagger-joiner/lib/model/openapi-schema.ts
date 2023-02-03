import { z } from "zod";

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
                license: z
                    .object({ name: z.string(), url: z.string().optional() })
                    .strict()
                    .optional(),
                version: z.string(),
            })
            .strict(),
        externalDocs: z
            .object({ description: z.string().optional(), url: z.string() })
            .strict()
            .optional(),
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
                                    .strict()
                            )
                            .optional(),
                    })
                    .strict()
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
                    .strict()
            )
            .optional(),
        paths: z.record(z.record(z.record(z.unknown()))),
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
        "The description of OpenAPI v3.0.x documents, as defined by https://spec.openapis.org/oas/v3.0.3"
    );

export type OpenApiSchema = z.infer<typeof openapiSchema>;
