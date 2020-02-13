import { Duration, Stack } from '@aws-cdk/core';
import { OriginProtocolPolicy, LambdaEdgeEventType, LambdaFunctionAssociation } from '@aws-cdk/aws-cloudfront';
import { Function, Runtime, Code} from '@aws-cdk/aws-lambda';

export function createOriginConfig(domain: any, stack: Stack) {
    return {
        customOriginSource: {
            domainName: domain.domainName,
            httpPort: domain.httpPort || 80,
            httpsPort: domain.httpsPort || 443,
            originProtocolPolicy: domain.protocolPolicy || OriginProtocolPolicy.HTTP_ONLY
        },
        behaviors: createBehaviors(domain.behaviors, stack),
        originPath: domain.originPath,
        originHeaders: createOriginHeaders(domain)
    }
}

function createOriginHeaders(domain: any): { [key: string] : string } {
    if(domain.apiKey) {
        return {
            'x-api-key': domain.apiKey
        } as { [key: string] : string };
    }

    return {};
}

function createBehaviors(behaviors: any[], stack: Stack) {
    if(behaviors == null || behaviors.length == 0) {
        return [{isDefaultBehavior: true, minTtl:Duration.seconds(0), maxTtl:Duration.seconds(0), defaultTtl: Duration.seconds(0), forwardedValues: { queryString: true }} ];
    }

    return behaviors.map(b => ({
        isDefaultBehavior: false,
        pathPattern: b.path,
        minTtl: Duration.seconds(0),
        maxTtl: Duration.seconds(b.cacheTtl || 60),
        defaultTtl: Duration.seconds(b.cacheTtl || 60),
        forwardedValues: {
            queryString: true,
            queryCacheKeys: b.queryCacheKeys
        },
        lambdaFunctionAssociations: getFunctionAssociation(b.removePath, stack)
    }));
}

function getFunctionAssociation(depth: number, stack: Stack): LambdaFunctionAssociation[] {
    if(depth) {
//        createLambda(depth, stack);

//        return [{
//            eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
//            lambdaFunction: createLambda(depth, stack).latestVersion
//        }];
    }

    return [];
}

function createLambda(depth: number, stack: Stack) {
    return new Function(stack, 'PathRemovingFunction', {
        runtime: Runtime.NODEJS_10_X,
        handler: 'index.handler',
        code: Code.fromInline("" +
            "exports.handler = (event, context, callback) => {\n" +
            "    const request = event.Records[0].cf.request;           // extract the request object\n" +
            "    for(let i = 0;i < " + depth + "; i++) {\n" +
            "        request.uri = request.uri.replace(/^\\/[^\\/]+\\//,'/');  // modify the URI\n" +
            "    }\n" +
            "    return callback(null, request);                        // return control to CloudFront\n" +
            "};"),
    });
}