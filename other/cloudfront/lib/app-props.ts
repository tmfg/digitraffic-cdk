import {FunctionType, LambdaType} from "./lambda/lambda-creator";
import {CloudFrontAllowedMethods} from "aws-cdk-lib/aws-cloudfront";
import {WafRules} from "./acl/waf-rules";

export class CFBehavior {
    readonly path: string;
    cacheTtl: number;
    queryCacheKeys?: string[];
    allowedMethods: CloudFrontAllowedMethods;
    viewerProtocolPolicy?: string;
    cacheHeaders: string[];

    // lambda-configs
    readonly lambdaTypes: Set<LambdaType> = new Set();
    readonly functionTypes: Set<FunctionType> = new Set();

    ipRestriction: string;

    constructor(path: string) {
        this.path = path;
        this.cacheTtl = 60;
        this.allowedMethods = CloudFrontAllowedMethods.GET_HEAD;

        this.cacheHeaders = [];

        this.lambdaTypes = new Set();
    }

    static path(path = "*"): CFBehavior {
        return new CFBehavior(path);
    }

    static standard(path = "*", ...cacheHeaders: string[]): CFBehavior {
        return new CFBehavior(path)
            .withCacheHeaders(...cacheHeaders)
            .withGzipRequirementLambda()
            .withHttpHeadersLambda();
    }

    static passAll(path = "*", ...cacheHeaders: string[]): CFBehavior {
        return new CFBehavior(path)
            .withCacheHeaders(...cacheHeaders)
            .allowAllMethods();
    }

    public withCacheTtl(ttl: number): CFBehavior {
        this.cacheTtl = ttl;

        return this;
    }

    public withQueryCacheKeys(...keys: string[]): CFBehavior {
        this.queryCacheKeys = keys;

        return this;
    }

    public withCacheHeaders(...headers: string[]): CFBehavior {
        this.cacheHeaders = headers;

        return this;
    }

    public allowHttpAndHttps(): CFBehavior {
        this.viewerProtocolPolicy = "allow-all";

        return this;
    }

    public httpsOnly(): CFBehavior {
        this.viewerProtocolPolicy = "https-only";

        return this;
    }

    public withIpRestrictionLambda(restriction: string): CFBehavior {
        this.ipRestriction = restriction;

        return this;
    }

    public withLambda(type: LambdaType): CFBehavior {
        this.lambdaTypes.add(type);

        return this;
    }

    public withFunction(type: FunctionType): CFBehavior {
        this.functionTypes.add(type);

        return this;
    }

    public allowAllMethods(): CFBehavior {
        this.allowedMethods = CloudFrontAllowedMethods.ALL;

        return this;
    }

    public withGzipRequirementLambda(): CFBehavior {
        return this.withLambda(LambdaType.GZIP_REQUIREMENT);
    }

    public withHttpHeadersLambda(): CFBehavior {
        return this.withLambda(LambdaType.HTTP_HEADERS);
    }

    public withIndexHtmlFunction(): CFBehavior {
        return this.withFunction(FunctionType.INDEX_HTML);
    }
}

export class CFDistribution {
    behaviors: CFBehavior[];

    constructor(behaviors: CFBehavior[]) {
        this.behaviors = behaviors;
    }
}

export class CFDomain extends CFDistribution {
    domainName: string;
    originPath?: string;
    originProtocolPolicy?: string;
    httpPort?: number;
    httpsPort?: number;
    apiKey?: string;
    headers: Record<string, string> = {};

    constructor(domainName: string, ...behaviors: CFBehavior[]) {
        super(behaviors);
        this.domainName = domainName;
    }

    static passAllDomain(domainName: string) {
        return new CFDomain(domainName, CFBehavior.passAll());
    }

    static apiGateway(domainName: string, ...behaviors: CFBehavior[]): CFDomain {
        const domain = new CFDomain(domainName, ...behaviors);

        domain.originPath = "/prod";

        return domain;
    }

    static apiGatewayWithApiKey(domainName: string, apiKey: string, ...behaviors: CFBehavior[]): CFDomain {
        const domain = this.apiGateway(domainName, ...behaviors);

        domain.apiKey = apiKey;

        return domain;
    }

    static nginx(domainName: string, ...behaviors: CFBehavior[]): CFDomain {
        const domain = new CFDomain(domainName, ...behaviors);

        domain.originProtocolPolicy = 'http-only';

        return domain;
    }

    static mqtt(domainName: string) {
        const domain = new CFDomain(domainName, CFBehavior.passAll("mqtt*").httpsOnly());

        domain.originProtocolPolicy = 'https-only';

        return domain;
    }

    private addHeader(name: string, value: string) {
        this.headers[name] = value;

        return this;
    }
}

export class S3Domain extends CFDistribution {
    s3BucketName?: string;
    originPath?: string;

    constructor(s3BucketName: string, ...behaviors: CFBehavior[]) {
        super(behaviors);

        this.s3BucketName = s3BucketName;
    }

    static swagger(s3BucketName: string, path = "swagger/*"): S3Domain {
        return this.s3(s3BucketName, CFBehavior.path(path)
            .withCacheTtl(120)
            .withIndexHtmlFunction());
    }

    static s3(s3BucketName: string, ...behaviors: CFBehavior[]): S3Domain {
        return new S3Domain(s3BucketName, ...behaviors);
    }
}

export type Props = {
    readonly originAccessIdentity?: boolean,
    readonly distributionName: string,
    readonly environmentName: string,
    readonly aliasNames: string[] | null,
    readonly acmCertRef: string | null,
    readonly aclRules?: WafRules,
    readonly distributions: CFDistribution[]
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
    readonly lambdaTypes: (LambdaType | FunctionType)[],
    readonly lambdaParameters?: CFLambdaParameters
}