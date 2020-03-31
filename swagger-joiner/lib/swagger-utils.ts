import {mergeDeepLeft} from "ramda";

export function constructSwagger(spec: object) {
    return `
        window.onload = function() {
            const ui = SwaggerUIBundle({
            spec: ${JSON.stringify(spec)},
            dom_id: '#swagger-ui',
            deepLinking: true,
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
        `;
}

export function mergeApiDescriptions(allApis: object[]) {
    return allApis.reduce((acc, curr) => mergeDeepLeft(curr, acc));
}
