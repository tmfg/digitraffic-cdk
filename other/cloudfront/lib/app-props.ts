import {LambdaType} from "./lambda/lambda-creator";
import {CloudFrontAllowedMethods} from "aws-cdk-lib/aws-cloudfront";
import {WafRules} from "./acl/waf-rules";

export class CFBehavior {
    path: string;
    cacheTtl?: number;
    queryCacheKeys?: string[];
    allowedMethods?: CloudFrontAllowedMethods;
    viewerProtocolPolicy?: string;
    cacheHeaders?: string[];

    // lambda-configs
    lambdaTypes?: Set<LambdaType>;

    ipRestriction?: string;
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

        this.lambdaTypes = new Set();
    }

    static path(path = "*"): BehaviorBuilder {
        return new BehaviorBuilder({
            path,
        });
    }

    static standard(path = "*", ...cacheHeaders: string[]): BehaviorBuilder {
        return new BehaviorBuilder({
            path,
            cacheHeaders,
        }).withGzipRequirementLambda().withHttpHeadersLambda();
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

    public withIpRestrictionLambda(restriction: string): BehaviorBuilder {
        this.ipRestriction = restriction;

        return this;
    }

    public withLambda(lambdaType: LambdaType): BehaviorBuilder {
        this.lambdaTypes?.add(lambdaType);

        return this;
    }

    public allowAllMethods(): BehaviorBuilder {
        this.allowedMethods = CloudFrontAllowedMethods.ALL;

        return this;
    }

    public withGzipRequirementLambda(): BehaviorBuilder {
        return this.withLambda(LambdaType.GZIP_REQUIREMENT);
    }

    public withHttpHeadersLambda(): BehaviorBuilder {
        return this.withLambda(LambdaType.HTTP_HEADERS);
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
    readonly originAccessIdentity?: boolean,
    readonly distributionName: string,
    readonly environmentName: string,
    readonly aliasNames: string[] | null,
    readonly acmCertRef: string | null,
    readonly aclRules?: WafRules,
    readonly domains: CFDomain[]
}

export type ElasticProps = {
    readonly streamingProps: StreamingLogProps,
    readonly elasticDomain: string,
    readonly elasticArn: string,
}

export type StreamingLogProps = {
    readonly memorySize?: number,
    readonly batchSize?: number,
    readonly maxBatchingWindow?: number
}

export type CFProps = {
    readonly elasticProps: ElasticProps,
    readonly elasticAppName: string,
    readonly props: Props[],
    readonly lambdaProps?: CFLambdaProps,
}

export type CFLambdaParameters = {
    readonly weathercamDomainName?: string,
    readonly weathercamHostName?: string,
    readonly ipRestrictions?: {
        [key: string]: string,
    },
}

export type CFLambdaProps = {
    readonly lambdaTypes: LambdaType[],
    readonly lambdaParameters?: CFLambdaParameters
}