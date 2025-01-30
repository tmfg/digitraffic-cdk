import { Duration } from "aws-cdk-lib";
import {
  CloudFrontAllowedMethods,
  OriginProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import type { WafRules } from "./acl/waf-rules.js";
import { LambdaType } from "./util/lambda-creator.js";
import { FunctionType } from "./util/function-creator.js";

export class CFBehavior {
  readonly path: string;
  cacheTtl: number;
  queryCacheKeys?: string[]; // this must allow undefined, as it has other meaning than empty array
  allowedMethods: CloudFrontAllowedMethods;
  viewerProtocolPolicy?: string;
  cacheHeaders: string[];

  // lambda-configs
  readonly lambdaTypes: Set<LambdaType> = new Set<LambdaType>();
  readonly functionTypes: Set<FunctionType> = new Set<FunctionType>();

  ipRestriction: string;
  redirect: string;

  constructor(path: string) {
    this.path = path;
    this.cacheTtl = 60;
    this.allowedMethods = CloudFrontAllowedMethods.GET_HEAD;
    this.cacheHeaders = [];

    this.lambdaTypes = new Set();
  }

  static path(path: string = "*"): CFBehavior {
    return new CFBehavior(path);
  }

  static standard(path: string = "*", ...cacheHeaders: string[]): CFBehavior {
    return new CFBehavior(path)
      .withCacheHeaders(...cacheHeaders)
      .withGzipRequirementLambda()
      .withHttpHeadersLambda();
  }

  static passAll(path: string = "*", ...cacheHeaders: string[]): CFBehavior {
    return new CFBehavior(path).withCacheHeaders(...cacheHeaders)
      .allowAllMethods();
  }

  public withCacheTtl(ttl: number): this {
    this.cacheTtl = ttl;

    return this;
  }

  public withQueryCacheKeys(...keys: string[]): this {
    this.queryCacheKeys = keys;

    return this;
  }

  public withCacheHeaders(...headers: string[]): this {
    this.cacheHeaders = headers;

    return this;
  }

  public allowHttpAndHttps(): this {
    this.viewerProtocolPolicy = "allow-all";

    return this;
  }

  public httpsOnly(): this {
    this.viewerProtocolPolicy = "https-only";

    return this;
  }

  public httpOnly(): this {
    this.viewerProtocolPolicy = "http-only";

    return this;
  }

  public withRedirect(name: string): this {
    this.redirect = name;

    return this;
  }

  public withIpRestrictionLambda(restriction: string): this {
    this.ipRestriction = restriction;

    return this;
  }

  public withLambda(type: LambdaType): this {
    this.lambdaTypes.add(type);

    return this;
  }

  public withFunction(type: FunctionType): this {
    this.functionTypes.add(type);

    return this;
  }

  public allowAllMethods(): this {
    this.allowedMethods = CloudFrontAllowedMethods.ALL;

    return this;
  }

  public allowGetHeadOptionsMethods(): this {
    this.allowedMethods = CloudFrontAllowedMethods.GET_HEAD_OPTIONS;

    return this;
  }

  public withGzipRequirementLambda(): this {
    return this.withLambda(LambdaType.GZIP_REQUIREMENT);
  }

  public withHttpHeadersLambda(): this {
    return this.withLambda(LambdaType.HTTP_HEADERS);
  }

  public withIndexHtmlFunction(): this {
    return this.withFunction(FunctionType.INDEX_HTML);
  }

  public withHistoryRedirectFunction(): this {
    return this.withFunction(FunctionType.HISTORY_REDIRECT);
  }
}

export class CFOrigin {
  behaviors: CFBehavior[];

  constructor(behaviors: CFBehavior[]) {
    this.behaviors = behaviors;
  }
}

export class CFDomain extends CFOrigin {
  domainName: string;
  originPath?: string;
  originProtocolPolicy: OriginProtocolPolicy = OriginProtocolPolicy.HTTPS_ONLY;
  httpPort?: number;
  httpsPort?: number;
  apiKey?: string;
  cfName?: string;
  headers: Record<string, string> = {};
  // appears as "response timeout" in the console and as "read timeout" in cdk interfaces
  responseTimeout: Duration;

  constructor(domainName: string, ...behaviors: CFBehavior[]) {
    super(behaviors);
    this.domainName = domainName;
    this.responseTimeout = Duration.seconds(30);
  }

  static redirect(parameterName: string = "root"): CFDomain {
    return new CFDomain(
      "www.digitraffic.fi",
      CFBehavior.passAll("*").withRedirect(parameterName),
    );
  }

  static apiGateway(domainName: string, ...behaviors: CFBehavior[]): CFDomain {
    const domain = new CFDomain(domainName, ...behaviors);

    domain.originPath = "/prod";

    return domain;
  }

  static apiGatewayWithApiKey(
    domainName: string,
    apiKey: string,
    ...behaviors: CFBehavior[]
  ): CFDomain {
    const domain = this.apiGateway(domainName, ...behaviors);

    domain.apiKey = apiKey;

    return domain;
  }

  /**
   * Creates a domain that adds a custom header to the request made to the origin. This header can be used by
   * the origin (most likely an ALB) to check that the request is coming from this CloudFront.
   *
   * @param domainName
   * @param cfName
   * @param behaviors
   */
  static alb(
    domainName: string,
    cfName: string,
    ...behaviors: CFBehavior[]
  ): CFDomain {
    const domain = new CFDomain(domainName, ...behaviors);

    domain.cfName = cfName;

    return domain;
  }

  static nginx(domainName: string, ...behaviors: CFBehavior[]): CFDomain {
    const domain = new CFDomain(domainName, ...behaviors);

    domain.originProtocolPolicy = OriginProtocolPolicy.HTTP_ONLY;

    return domain;
  }

  static mqtt(domainName: string): CFDomain {
    const domain = new CFDomain(
      domainName,
      CFBehavior.passAll("mqtt*").httpsOnly(),
    );

    domain.originProtocolPolicy = OriginProtocolPolicy.HTTP_ONLY;

    return domain;
  }

  private addHeader(name: string, value: string): this {
    this.headers[name] = value;

    return this;
  }

  public httpOnly(): this {
    this.originProtocolPolicy = OriginProtocolPolicy.HTTP_ONLY;

    return this;
  }

  public withResponseTimeout(seconds: number): this {
    if (seconds > 60 || seconds < 1) {
      throw new Error(`Invalid response timeout value (range is 1-60 seconds)`);
    }
    this.responseTimeout = Duration.seconds(seconds);

    return this;
  }
}

export class S3Domain extends CFOrigin {
  s3BucketName: string;
  s3Domain?: string;
  createOAI: boolean = true;

  constructor(s3BucketName: string, ...behaviors: CFBehavior[]) {
    super(behaviors);

    this.s3BucketName = s3BucketName;
  }

  static swagger(s3BucketName: string, path: string = "swagger/*"): S3Domain {
    return this.s3(
      s3BucketName,
      CFBehavior.path(path).withCacheTtl(120).withIndexHtmlFunction(),
    );
  }

  static s3(s3BucketName: string, ...behaviors: CFBehavior[]): S3Domain {
    return new S3Domain(s3BucketName, ...behaviors);
  }

  static s3External(
    s3BucketName: string,
    s3Domain: string,
    ...behaviors: CFBehavior[]
  ): S3Domain {
    const domain = new S3Domain(s3BucketName, ...behaviors);
    domain.s3Domain = s3Domain;
    domain.createOAI = false;

    return domain;
  }
}

export interface DistributionProps {
  readonly originAccessIdentity?: boolean;
  readonly distributionName: string;
  readonly environmentName: string;
  readonly aliasNames: string[];
  readonly acmCertRef?: string;
  readonly aclRules?: WafRules[];
  readonly origins: CFOrigin[];
  readonly disableShieldAdvanced?: boolean;
  readonly geoblock?: string[];
}

export interface StreamingLogProps {
  readonly memorySize?: number;
  readonly batchSize?: number;
  readonly maxBatchingWindow?: number;
}

export interface CFProps {
  readonly realtimeLogConfigArn: string;
  readonly distributions: DistributionProps[];
  readonly secretsArn?: string;
  readonly lambdaParameters?: CFLambdaParameters;
  /** Enable standard S3 logging for CF distributions */
  readonly bucketLogging?: {
    readonly bucket: `${string}.s3.amazonaws.com`;
    readonly prefix: string;
  };
}

export interface CFLambdaParameters {
  readonly weathercamDomainName?: string;
  readonly weathercamHostName?: string;
  readonly ipRestrictions?: Record<string, string>;
  readonly redirects?: Record<string, string>;
  readonly smRef?: string;
}
