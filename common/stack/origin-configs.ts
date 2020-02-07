export function createOriginConfig(domainName: string, originPath: string, paths: string[]) {
    return {
        customOriginSource: {
            domainName: domainName
        },
        behaviors: createBehaviors(paths),
        originPath: originPath
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