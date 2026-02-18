import type { StackProps } from "aws-cdk-lib";
import { Duration, Stack, Tags } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import type {
  BehaviorOptions,
  CfnDistribution,
  EdgeLambda,
  FunctionAssociation,
  IOrigin,
  IOriginRequestPolicy,
  IRealtimeLogConfig,
} from "aws-cdk-lib/aws-cloudfront";
import {
  CachedMethods,
  CfnVpcOrigin,
  VpcOrigin as CfVpcOrigin,
  Distribution,
  HttpVersion,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import {
  HttpOrigin,
  S3BucketOrigin,
  VpcOrigin,
} from "aws-cdk-lib/aws-cloudfront-origins";
import { Bucket } from "aws-cdk-lib/aws-s3";
import type { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import type { Construct } from "constructs";
import { createWebAcl } from "./acl/acl-creator.js";
import type { WafRules } from "./acl/waf-rules.js";
import type { Behavior, OriginType } from "./distribution/behavior.js";
import { DistributionBuilder } from "./distribution/distribution-builder.js";
import { CachePolicyFactory } from "./util/cachepolicy-factory.js";
import { EdgeLambdaFactory } from "./util/edgalambda-factory.js";
import { EdgeFunctionFactory } from "./util/edgefunction-factory.js";
import { FunctionType } from "./util/function-creator.js";
import { LambdaType } from "./util/lambda-creator.js";

export class CloudfrontCdkStack extends Stack {
  readonly _cachePolicyFactory: CachePolicyFactory;
  readonly _edgeLambdaFactory: EdgeLambdaFactory;
  readonly _edgeFunctionFactory: EdgeFunctionFactory;

  private _defaults: {
    logConfigArn?: string;
    aclRule?: WafRules;
  };

  private _originIndex: number = 0;
  private _vpcOrigins: Record<string, CfnVpcOrigin> = {};
  private _originCache: Record<string, IOrigin> = {};

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this._defaults = {};

    this._cachePolicyFactory = new CachePolicyFactory(this);
    this._edgeLambdaFactory = new EdgeLambdaFactory(this);
    this._edgeFunctionFactory = new EdgeFunctionFactory(this);
  }

  public withLogConfig(configArn: string): this {
    this._defaults.logConfigArn = configArn;

    return this;
  }

  public withAclRule(aclRule: WafRules): this {
    this._defaults.aclRule = aclRule;
    return this;
  }

  public withDistribution(
    name: string,
    certificate: string,
    buildFunction: (builder: DistributionBuilder) => void,
  ): this {
    const builder = new DistributionBuilder(this, name, certificate);

    // clear all caches
    this._originIndex = 0;
    this._vpcOrigins = {};
    this._originCache = {};

    if (this._defaults.logConfigArn) {
      builder.withLogConfig(this._defaults.logConfigArn);
    }

    if (this._defaults.aclRule) {
      builder.withAclRule(this._defaults.aclRule);
    }

    buildFunction(builder);

    if (builder.behaviors.length === 0) {
      throw new Error(`No behaviors defined for ${builder.name}`);
    }
    this.addDistribution(builder);

    return this;
  }

  addDistribution(builder: DistributionBuilder): void {
    if (!builder.logConfig) {
      throw new Error(`Missing logConfig for ${builder.name}`);
    }
    const defaultBehavior = builder.findDefaultBehavior();
    const additionalBehaviors = builder.behaviors.filter(
      (b) => b !== defaultBehavior,
    );

    const certificate = Certificate.fromCertificateArn(
      this,
      `${builder.name}-Certificate`,
      builder.certificate,
    );

    Object.entries(builder.vpcOrigins).forEach(([vpcOriginName, arn]) => {
      this._vpcOrigins[vpcOriginName] = new CfnVpcOrigin(
        this,
        `CfnVpcOrigin-${vpcOriginName}`,
        {
          vpcOriginEndpointConfig: {
            arn,
            httpsPort: 443,
            httpPort: 80,
            name: `CloudfrontVpcOrigin-${vpcOriginName}`,
            originProtocolPolicy: "match-viewer",
          },
        },
      );
    });

    const webAcl: CfnWebACL = createWebAcl(
      this,
      builder.aliasNames[0] ?? "",
      builder.wafRules,
      builder.name,
      builder.logGroupName,
    );

    const distribution = new Distribution(this, builder.name, {
      defaultBehavior: this.createBehavior(defaultBehavior, builder.logConfig),
      additionalBehaviors: this.createAdditionalBehaviors(
        additionalBehaviors,
        builder.logConfig,
      ),
      domainNames: builder.aliasNames,
      httpVersion: HttpVersion.HTTP2_AND_3,
      defaultRootObject: builder.defaultRootObject,
      certificate,
      webAclId: webAcl.attrArn,
    });

    Tags.of(distribution).add("EnableShieldAdvanced", "true");

    // temporary override logical-id to see actual diff from old implementation
    if (builder.logicalId) {
      (distribution.node.defaultChild as CfnDistribution).overrideLogicalId(
        builder.logicalId,
      );
    }
  }

  getOriginRequestPolicy(originType: OriginType): IOriginRequestPolicy {
    switch (originType) {
      case "s3":
        return OriginRequestPolicy.CORS_S3_ORIGIN;
      case "api-gateway":
        return OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER;
      case "vpc":
      case "http":
      case "https":
        return OriginRequestPolicy.ALL_VIEWER;
    }
  }

  createBehavior(
    behavior: Behavior,
    realtimeLogConfigArn: string,
  ): BehaviorOptions {
    const originRequestPolicy = this.getOriginRequestPolicy(
      behavior.origin._type,
    );
    const cachePolicy = this._cachePolicyFactory.getCachePolicy(
      behavior.ttl,
      behavior.cacheHeaders,
      behavior.cacheKeys,
    );

    const edgeLambdas = this.createEdgeLambdas(behavior);
    const functionAssociations = this.createFunctions(behavior);
    const origin = this.getOrigin(behavior);

    return {
      realtimeLogConfig: {
        realtimeLogConfigRef: {
          realtimeLogConfigArn,
        },
      } as IRealtimeLogConfig,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: behavior.allowedMethods,
      cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
      responseHeadersPolicy:
        ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT,
      originRequestPolicy,
      cachePolicy,
      edgeLambdas,
      functionAssociations,
      origin,
    };
  }

  getOrigin(behavior: Behavior): IOrigin {
    const cacheKey = behavior.origin._origin;

    if (!this._originCache[cacheKey]) {
      this._originCache[cacheKey] = this.createOrigin(behavior);
    }

    return this._originCache[cacheKey];
  }

  createS3Origin(bucketParameter: string): IOrigin {
    // this will not set OAC for the buckets! So it must be set manually

    // if bucket has full address, use it, otherwise
    // add default ending
    const dotIndex = bucketParameter.indexOf(".");
    const bucketRegionalDomainName =
      dotIndex > -1
        ? bucketParameter
        : `${bucketParameter}.s3.eu-west-1.amazonaws.com`;
    const bucketName =
      dotIndex > -1 ? bucketParameter.substring(0, dotIndex) : bucketParameter;

    const bucket = Bucket.fromBucketAttributes(this, `bucket-${bucketName}`, {
      bucketArn: `arn:aws:s3:::${bucketName}`,
      bucketRegionalDomainName,
    });

    return S3BucketOrigin.withOriginAccessControl(bucket, {
      originId: `origin${this._originIndex}`,
    });
  }

  createOrigin(behavior: Behavior): IOrigin {
    this._originIndex++;

    if (behavior.origin._type === "s3") {
      return this.createS3Origin(behavior.origin._origin);
    }

    const customHeaders = behavior.apiKey
      ? { "x-api-key": behavior.apiKey }
      : ({} as Record<string, string>);
    // TODO: other custom headers

    if (behavior.origin._type === "vpc") {
      const vpcOrigin = this._vpcOrigins[behavior.origin._origin];

      if (!vpcOrigin) {
        throw new Error(`Missing vpc origin ${behavior.origin._origin}`);
      }

      const cfVpcOrigin = CfVpcOrigin.fromVpcOriginId(
        this,
        "vpcOrigin",
        vpcOrigin.ref,
      );

      return VpcOrigin.withVpcOrigin(cfVpcOrigin, {
        originId: `vpcOrigin-${behavior.origin._origin}`,
        domainName: "internal-web-test-1221465418.eu-west-1.elb.amazonaws.com",
        readTimeout: Duration.seconds(behavior.readTimeout),
        connectionAttempts: 3,
        connectionTimeout: Duration.seconds(10),
        keepaliveTimeout: Duration.seconds(5),
        customHeaders,
        originPath: behavior.origin._path,
        //        protocolPolicy: OriginProtocolPolicy.MATCH_VIEWER
      });
    }

    const protocolPolicy =
      behavior.origin._type === "http"
        ? OriginProtocolPolicy.HTTP_ONLY
        : OriginProtocolPolicy.HTTPS_ONLY;

    return new HttpOrigin(behavior.origin._origin, {
      originId: `origin${this._originIndex}`,
      readTimeout: Duration.seconds(behavior.readTimeout),
      connectionAttempts: 3,
      connectionTimeout: Duration.seconds(10),
      httpPort: 80,
      httpsPort: 443,
      keepaliveTimeout: Duration.seconds(5),
      customHeaders,
      originPath: behavior.origin._path,
      protocolPolicy,
    });
  }

  createEdgeLambdas(behavior: Behavior): EdgeLambda[] {
    const lambdas: EdgeLambda[] = [];

    // handle all edge lambdas
    for (const [eventType, lambdaType] of behavior.lambdaConfig.lambdas) {
      let functionVersion;

      switch (lambdaType) {
        case LambdaType.WEATHERCAM_HTTP_HEADERS:
          functionVersion =
            this._edgeLambdaFactory.getWeathercamHeadersLambda();

          break;

        case LambdaType.WEATHERCAM_REDIRECT: {
          const weathercamParams = behavior.lambdaConfig.parameters.weathercam;

          if (!weathercamParams) throw new Error("Missing weathercam params");

          functionVersion = this._edgeLambdaFactory.getWeathercamRewriteLambda(
            weathercamParams.host,
            weathercamParams.url,
          );

          break;
        }

        case LambdaType.LAM_REDIRECT:
          if (!behavior.lambdaConfig.parameters.smRef) {
            throw new Error("Missing smRef parameter");
          }

          functionVersion = this._edgeLambdaFactory.getLamRedirectLambda(
            behavior.lambdaConfig.parameters.smRef,
          );

          break;

        case LambdaType.LAM_HEADERS:
          functionVersion = this._edgeLambdaFactory.getLamHeadersLambda();

          break;

        case LambdaType.HTTP_HEADERS:
          functionVersion = this._edgeLambdaFactory.getHttpHeadersLambda();

          break;

        case LambdaType.IP_RESTRICTION: {
          const parameters = behavior.lambdaConfig.parameters.ipRestriction;
          if (!parameters) throw new Error("Missing ip restriction parameters");
          functionVersion =
            this._edgeLambdaFactory.getIpRestrictionLambda(parameters);

          break;
        }

        case LambdaType.GZIP_REQUIREMENT:
          functionVersion = this._edgeLambdaFactory.getGzipRequirementLambda();

          break;
      }

      lambdas.push({
        functionVersion,
        eventType,
      });
    }

    return lambdas;
  }

  createFunctions(behavior: Behavior): FunctionAssociation[] {
    const functions: FunctionAssociation[] = [];

    // handle all edge functions
    for (const [eventType, functionType] of behavior.lambdaConfig.functions) {
      let functionVersion;

      switch (functionType) {
        case FunctionType.INDEX_HTML:
          functionVersion = this._edgeFunctionFactory.getIndexHtmlFunction();

          break;

        case FunctionType.REDIRECT: {
          const redirectUrl = behavior.lambdaConfig.parameters.redirectUrl;
          if (!redirectUrl) throw new Error("Missing redirect url");

          functionVersion =
            this._edgeFunctionFactory.getRedirectFunction(redirectUrl);

          break;
        }

        case FunctionType.PATH_REWRITE: {
          const pathRemoveCount =
            behavior.lambdaConfig.parameters.pathRemoveCount;
          if (!pathRemoveCount) throw new Error("Missing pathRemoveCount");

          functionVersion =
            this._edgeFunctionFactory.getPathRewriteFunction(pathRemoveCount);

          break;
        }

        case FunctionType.HTTP_HEADERS:
          functionVersion = this._edgeFunctionFactory.getHttpHeadersFunction();

          break;
      }

      functions.push({
        function: functionVersion,
        eventType,
      });
    }

    return functions;
  }

  createAdditionalBehaviors(
    behaviors: Behavior[],
    logConfig: string,
  ): Record<string, BehaviorOptions> {
    const behaviorRecord: Record<string, BehaviorOptions> = {};

    behaviors.forEach((b) => {
      behaviorRecord[b.behaviorPath] = this.createBehavior(b, logConfig);
    });

    return behaviorRecord;
  }
}
