import { OpenApiSchema } from "./model/openapi-schema";
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

function methodIsDeprecated(apiDescription: OpenApiSchema, path: string, method: string): boolean {
    const deprecationTextMatcher = /(W|w)ill be removed/;
    const headerMatcher = /(headers.*deprecation.*sunset|headers.*sunset.*deprecation)/i;
    return (
        typeof apiDescription.paths[path][method].summary === "string" &&
        (deprecationTextMatcher.test(apiDescription.paths[path][method].summary as string) ||
            headerMatcher.test(JSON.stringify(apiDescription.paths[path][method])))
    );
}

export function setDeprecatedPerMethod(apiDescription: OpenApiSchema): void {
    Object.keys(apiDescription.paths).forEach((path) =>
        Object.keys(apiDescription.paths[path]).forEach((method) => {
            // set deprecated: true if field does not exist and conditions are met
            if (
                !("deprecated" in apiDescription.paths[path][method]) &&
                methodIsDeprecated(apiDescription, path, method)
            ) {
                apiDescription.paths[path][method].deprecated = true;
            }
        })
    );
}
