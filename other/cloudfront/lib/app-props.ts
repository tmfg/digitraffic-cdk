import {LambdaType} from "./lambda/lambda-creator";
import {CloudFrontAllowedMethods, LambdaEdgeEventType} from "aws-cdk-lib/aws-cloudfront";
import {WafRules} from "./acl/waf-rules";

export class CFBehavior {
    path: string;
    cacheTtl?: number;
    queryCacheKeys?: string[];
    allowedMethods?: CloudFrontAllowedMethods;
    viewerProtocolPolicy?: string;
    cacheHeaders?: string[];

    // lambda-configs
    ipRestriction?: string;
    gzipRequirementLambda?: boolean;
    httpHeadersLambda?: boolean;
    weathercamRedirectLambda?: boolean;
}

export class BehaviorBuilder extends CFBehavior {
    constructor(behavior: CFBehavior) {
        super();
        this.path = behavior.path;
        this.cacheTtl = behavior.cacheTtl;
        this.queryCacheKeys = behavior.queryCacheKeys;
        this.allowedMethods = behavior.allowedMethods;
        this.viewerProtocolPolicy = behavior.viewerProtocolPolicy;
        this.cacheHeaders = behavior.cacheHeaders;
        this.ipRestriction = behavior.ipRestriction;
        this.gzipRequirementLambda = behavior.gzipRequirementLambda;
        this.httpHeadersLambda = behavior.httpHeadersLambda;
        this.weathercamRedirectLambda = behavior.weathercamRedirectLambda;
    }

    static path(path = "*"): BehaviorBuilder {
        return new BehaviorBuilder({
            path,
        });
    }

    static standard(path = "*", ...cacheHeaders: string[]): BehaviorBuilder {
        return new BehaviorBuilder({
            path,
            gzipRequirementLambda: true,
            httpHeadersLambda: true,
            cacheHeaders,
        });
    }

    static passAll(path = "*", ...cacheHeaders: string[]): BehaviorBuilder {
        return new BehaviorBuilder({
            path,
            allowedMethods: CloudFrontAllowedMethods.ALL,
            cacheHeaders,
        });
    }

    public withCacheTtl(ttl: number): BehaviorBuilder {
        this.cacheTtl = ttl;

        return this;
    }

    public withQueryCacheKeys(...keys: string[]): BehaviorBuilder {
        this.queryCacheKeys = keys;

        return this;
    }

    public withCacheHeaders(...headers: string[]): BehaviorBuilder {
        this.cacheHeaders = headers;

        return this;
    }

    public allowHttpAndHttps(): BehaviorBuilder {
        this.viewerProtocolPolicy = "allow-all";

        return this;
    }

    public httpsOnly(): BehaviorBuilder {
        this.viewerProtocolPolicy = "https-only";

        return this;
    }

    public restriction(restriction: string): BehaviorBuilder {
        this.ipRestriction = restriction;

        return this;
    }

    public allowAllMethods(): BehaviorBuilder {
        this.allowedMethods = CloudFrontAllowedMethods.ALL;

        return this;
    }

    public withGzipRequirementLambda(): BehaviorBuilder {
        this.gzipRequirementLambda= true;

        return this;
    }

    public withHttpHeadersLambda(): BehaviorBuilder {
        this.httpHeadersLambda = true;
        return this;
    }

    public withWeathercamRedirectLambda(): BehaviorBuilder {
        this.weathercamRedirectLambda = true;

        return this;
    }
}

export class CFDomain {
    s3BucketName?: string;
    domainName?: string;
    originPath?: string;
    originProtocolPolicy?: string;
    httpPort?: number;
    httpsPort?: number;
    apiKey?: string;
    behaviors: CFBehavior[];
}

export class DomainBuilder extends CFDomain {
    static passAllDomain(domainName: string) {
        return {
            domainName,
            behaviors: [BehaviorBuilder.passAll()],
        };
    }

    static apiGateway(domainName: string, ...behaviors: CFBehavior[]): DomainBuilder {
        return {
            domainName,
            originPath: "/prod",
            behaviors,
        } as DomainBuilder;
    }

    static apiGatewayWithApiKey(domainName: string, apiKey: string, ...behaviors: CFBehavior[]): DomainBuilder {
        return {
            domainName,
            originPath: "/prod",
            apiKey,
            behaviors,
        } as DomainBuilder;
    }

    static nginx(domainName: string, ...behaviors: CFBehavior[]): DomainBuilder {
        return {
            domainName,
            originProtocolPolicy: 'http-only',
            behaviors,
        } as DomainBuilder;
    }

    static mqtt(domainName: string) {
        return {
            domainName,
            originProtocolPolicy: 'https-only',
            behaviors: [
                BehaviorBuilder.passAll("mqtt*").httpsOnly(),
            ],
        };
    }

    static swagger(s3BucketName: string, path = "swagger/*"): DomainBuilder {
        return {
            s3BucketName,
            behaviors: [
                {
                    path,
                    cacheTtl: 120,
                },
            ],
        } as DomainBuilder;
    }

    static s3(s3BucketName: string, ...behaviors: CFBehavior[]): DomainBuilder {
        return {
            s3BucketName,
            behaviors,
        } as DomainBuilder;
    }
}

export type Props = {
    originAccessIdentity?: boolean,
    distributionName: string,
    environmentName: string,
    aliasNames: string[] | null,
    acmCertRef: string | null,
    aclRules?: WafRules,
    domains: CFDomain[]
}

export type ElasticProps = {
    streamingProps: StreamingLogProps,
    elasticDomain: string,
    elasticArn: string,
}

export type StreamingLogProps = {
    memorySize?: number,
    batchSize?: number,
    maxBatchingWindow?: number
}

export type CFProps = {
    elasticProps: ElasticProps,
    elasticAppName: string,
    props: Props[],
    lambdaProps?: CFLambdaProps,
}

export type CFLambdaParameters = {
    weathercamDomainName?: string,
    weathercamHostName?: string,
    ipRestrictions?: {
        [key: string]: string,
    },
}

export type CFLambdaProps = {
    lambdaTypes: LambdaType[],
    lambdaParameters?: CFLambdaParameters
}