import {mergeDeepLeft} from "ramda";

export type ApiDescriptions = Record<string, unknown> & {
    readonly info: {
        description: string
        title: string
    }
    readonly paths: Record<string, Record<string, Record<string, string>>>
}

export function constructSwagger(spec: object) {
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
                docExpansion: 'none',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset.slice(1) // remove top bar plugin
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
                })
                // End Swagger UI call region
        
                window.ui = ui
            }
        }
        `;
}

export function mergeApiDescriptions(allApis: object[]): ApiDescriptions {
    return allApis.reduce((acc, curr) => mergeDeepLeft(curr, acc)) as ApiDescriptions;
}
