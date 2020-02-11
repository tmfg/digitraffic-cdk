export function createOriginConfig(domain: any) {
    return {
        customOriginSource: {
            domainName: domain.domainName,
            httpPort: domain.httpPort || 80,
            httpsPort: domain.httpsPort || 443,
        },
        behaviors: createBehaviors(domain.behaviors),
        originPath: domain.originPath,
        originProtocolPolicy: domain.protocolPolicy || "http-only"
    }
}

function createBehaviors(paths: string[]) {
    if(paths == null || paths.length == 0) {
        return [{isDefaultBehavior: true}];
    }

    return paths.map(p => ({
        isDefaultBehavior: false,
        pathPattern: p
    }));
}