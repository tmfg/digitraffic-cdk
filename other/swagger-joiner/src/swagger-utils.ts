import { type OpenApiSchema, type OpenApiOperation, openapiOperation } from "./model/openapi-schema.js";
import _ from "lodash";

export function constructSwagger(spec: object): string {
    return `
        function showNotSupportedContent() {
            document.querySelector('html').innerHTML = '<div>Query parameters not supported</div>';
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('url') || params.get('spec') || params.get('urls') || params.get('configUrl')) {
            showNotSupportedContent();
        } else {
            window.onload = function() {
                const ui = SwaggerUIBundle({
                    spec: ${JSON.stringify(spec)},
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    defaultModelRendering: 'model',
                    defaultModelExpandDepth: 6,
                    docExpansion: 'none',
                    operationsSorter: 'alpha',
                    tagsSorter: 'alpha',
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset.slice(1) // remove top bar plugin
                    ],
                    plugins: [
                        SwaggerUIBundle.plugins.DownloadUrl
                    ],
                    layout: "StandaloneLayout",
                    requestInterceptor: (request) => {
                      request.curlOptions = ['-H', 'Digitraffic-User: Nimimerkki/EsimerkkiApp 0.1', '--compressed'];
                      return request;
                    }
                })
                // End Swagger UI call region
        
                window.ui = ui
            }
        }
        `;
}

export function mergeApiDescriptions(allApis: OpenApiSchema[]): OpenApiSchema {
    return allApis.reduce((acc, curr) => _.merge(acc, curr));
}

function methodIsDeprecated(operation: OpenApiOperation): boolean {
    const deprecationTextMatcher = /(W|w)ill be removed/;
    const summaryMatch = operation.summary && deprecationTextMatcher.test(operation.summary);

    // I think this witchcraft probably tries to look into operation.response.headers.
    const headerMatcher = /(headers.*deprecation.*sunset|headers.*sunset.*deprecation)/i;
    const headerMatch = headerMatcher.test(JSON.stringify(operation));

    return summaryMatch || headerMatch;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOperation(value: any): value is OpenApiOperation {
    // Since all fields are optional, and more can be added, this doesn't discriminate very much.
    // Just check that types of any defined fields in OpenApiOperation type are correct.
    const parsed = openapiOperation.safeParse(value);
    return parsed.success;
}

export function withDeprecations(paths: OpenApiSchema["paths"]): OpenApiSchema["paths"] {
    const result = _.cloneDeep(paths);

    Object.values(result).forEach((pathItem) => {
        Object.values(pathItem)
            .filter(isOperation)
            .forEach((operation) => {
                if (methodIsDeprecated(operation)) {
                    operation.deprecated = true;
                }
            });
    });

    return result;
}

export function withoutSecurity(paths: OpenApiSchema["paths"]): OpenApiSchema["paths"] {
    const result = _.cloneDeep(paths);

    Object.values(result).forEach((pathItem) => {
        Object.values(pathItem)
            .filter(isOperation)
            .forEach((operation) => {
                delete operation.security;
            });
    });

    return result;
}

export function withoutMethods(
    paths: OpenApiSchema["paths"],
    keyTest: (key: string) => boolean
): OpenApiSchema["paths"] {
    const result = _.cloneDeep(paths);

    Object.values(result).forEach((pathItem) => {
        Object.keys(pathItem).forEach((key) => {
            if (keyTest(key)) {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access --
                 * Must cast to any to allow indexing object by string.
                 **/
                delete (pathItem as any)[key];
            }
        });
    });

    return result;
}
