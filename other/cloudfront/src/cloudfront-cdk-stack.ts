import { StackCheckingAspect } from "@digitraffic/common/dist/aws/infra/stack/stack-checking-aspect";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { StackProps } from "aws-cdk-lib";
import { Annotations, Aspects, Stack } from "aws-cdk-lib";
import type {
  CfnDistribution,
  CloudFrontWebDistribution,
} from "aws-cdk-lib/aws-cloudfront";
import {
  CachePolicy,
  OriginAccessIdentity,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import {
  CompositePrincipal,
  ManagedPolicy,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";
import type {
  CFLambdaParameters,
  CFOrigin,
  CFProps,
  DistributionProps,
} from "./app-props.js";
import { createDistribution } from "./distribution-util.js";
import { LambdaHolder } from "./lambda-holder.js";
import { createOriginConfig } from "./origin-configs.js";
import {
  createHistoryPath,
  createIndexHtml,
  createRedirectFunction,
  FunctionType,
} from "./util/function-creator.js";
import {
  createGzipRequirement,
  createHttpHeaders,
  createIpRestriction,
  createLamHeaders,
  createLamRedirect,
  createWeathercamHttpHeaders,
  createWeathercamRedirect,
  LambdaType,
} from "./util/lambda-creator.js";

type ViewerPolicyMap = Record<string, string>;

interface MutablePolicy {
  viewerProtocolPolicy: string;
}

interface MutableCacheBehavior {
  cachePolicyId: string;
  originRequestPolicyId: string;
  responseHeadersPolicyId: string;
}

interface LambdaTypes {
  readonly lambdaTypes: Set<LambdaType>;
  readonly functionTypes: Set<FunctionType>;
  readonly ipRestrictions: Set<string>;
  readonly redirects: Set<string>;
}

export class CloudfrontCdkStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    cloudfrontProps: CFProps,
    props?: StackProps,
  ) {
    super(scope, id, props);

    const {
      distributions,
      lambdaParameters,
      bucketLogging,
      secretsArn,
      realtimeLogConfigArn,
    } = cloudfrontProps;

    this.validateDefaultBehaviors(distributions);

    const lambdaMap = this.createLambdaMap(distributions, lambdaParameters);

    distributions.forEach((distributionProps) =>
      this.createDistribution({
        distributionProps,
        lambdaMap,
        realtimeLogConfigArn,
        bucketLogging,
        secretsArn,
      })
    );

    Aspects.of(this).add(new StackCheckingAspect());
  }

  validateDefaultBehaviors(props: DistributionProps[]): void {
    props.forEach((distribution) => {
      // check default behaviors
      const defaults = distribution.origins.flatMap((d) => d.behaviors).filter((
        b,
      ) => b.path === "*");

      if (defaults.length === 0) {
        Annotations.of(this).addError(
          "no defaults for " + distribution.distributionName,
        );
      } else if (defaults.length > 1) {
        Annotations.of(this).addError(
          "multiple defaults for " + distribution.distributionName,
        );
        logger.error({
          method: "CloudfrontCdkStack.validateDefaultBehaviors",
          message: `defaults: ${defaults.join()}`,
        });
      }
    });
  }

  findLambdaTypes(props: DistributionProps[]): LambdaTypes {
    const lambdaTypes = new Set<LambdaType>();
    const functionTypes = new Set<FunctionType>();
    const ipRestrictions = new Set<string>();
    const redirects = new Set<string>();

    props
      .flatMap((p) => p.origins)
      .flatMap((d) => d.behaviors)
      .forEach((b) => {
        b.lambdaTypes.forEach((type) => lambdaTypes.add(type));
        b.functionTypes.forEach((type) => functionTypes.add(type));

        if (b.ipRestriction) {
          ipRestrictions.add(b.ipRestriction);
        }

        if (b.redirect) {
          redirects.add(b.redirect);
        }
      });

    return { lambdaTypes, functionTypes, ipRestrictions, redirects };
  }

  createLambdaMap(
    props: DistributionProps[],
    lParameters: CFLambdaParameters | undefined,
  ): LambdaHolder {
    const lambdaMap = new LambdaHolder();

    const types = this.findLambdaTypes(props);

    const edgeLambdaRole = new Role(this, "edgeLambdaRole", {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("lambda.amazonaws.com"),
        new ServicePrincipal("edgelambda.amazonaws.com"),
      ),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    if (types.lambdaTypes.has(LambdaType.WEATHERCAM_REDIRECT)) {
      if (!lParameters?.weathercamDomainName) {
        throw new Error("Missing lambdaParameter weathercamDomainName");
      } else if (!lParameters.weathercamHostName) {
        throw new Error("Missing lambdaParameter weathercamHostName");
      } else {
        lambdaMap.addLambda(
          LambdaType.WEATHERCAM_REDIRECT,
          createWeathercamRedirect(
            this,
            edgeLambdaRole,
            lParameters.weathercamDomainName,
            lParameters.weathercamHostName,
          ),
        );
      }
    }

    if (types.lambdaTypes.has(LambdaType.WEATHERCAM_HTTP_HEADERS)) {
      lambdaMap.addLambda(
        LambdaType.WEATHERCAM_HTTP_HEADERS,
        createWeathercamHttpHeaders(this, edgeLambdaRole),
      );
    }

    if (types.lambdaTypes.has(LambdaType.GZIP_REQUIREMENT)) {
      lambdaMap.addLambda(
        LambdaType.GZIP_REQUIREMENT,
        createGzipRequirement(this, edgeLambdaRole),
      );
    }

    if (types.lambdaTypes.has(LambdaType.HTTP_HEADERS)) {
      lambdaMap.addLambda(
        LambdaType.HTTP_HEADERS,
        createHttpHeaders(this, edgeLambdaRole),
      );
    }

    if (types.lambdaTypes.has(LambdaType.LAM_REDIRECT)) {
      if (!lParameters?.smRef) {
        throw new Error("Missing lambdaParameter smRef");
      } else {
        lambdaMap.addLambda(
          LambdaType.LAM_REDIRECT,
          createLamRedirect(this, edgeLambdaRole, lParameters.smRef),
        );
      }
    }

    if (types.lambdaTypes.has(LambdaType.LAM_HEADERS)) {
      lambdaMap.addLambda(
        LambdaType.LAM_HEADERS,
        createLamHeaders(this, edgeLambdaRole),
      );
    }

    if (types.functionTypes.has(FunctionType.INDEX_HTML)) {
      lambdaMap.addFunction(FunctionType.INDEX_HTML, createIndexHtml(this));
    }

    if (types.functionTypes.has(FunctionType.HISTORY_REDIRECT)) {
      lambdaMap.addFunction(
        FunctionType.HISTORY_REDIRECT,
        createHistoryPath(this),
      );
    }

    // handle ip restrictions
    const ipRestrictions = lParameters?.ipRestrictions;

    types.ipRestrictions.forEach((key) => {
      if (ipRestrictions && ipRestrictions[key]) {
        lambdaMap.addRestriction(
          key,
          createIpRestriction(this, edgeLambdaRole, key, ipRestrictions[key]),
        );
      } else {
        throw new Error("missing lambdaParameter ip restriction " + key);
      }
    });

    // handle redirects
    const redirects = lParameters?.redirects;

    types.redirects.forEach((key) => {
      if (redirects && redirects[key]) {
        lambdaMap.addRedirect(
          key,
          createRedirectFunction(this, redirects[key]),
        );
      } else {
        throw new Error("missing lambdaParameter redirect " + key);
      }
    });

    return lambdaMap;
  }

  createDistribution(props: {
    distributionProps: DistributionProps;
    lambdaMap: LambdaHolder;
    realtimeLogConfigArn: string;
    bucketLogging?: CFProps["bucketLogging"];
    secretsArn?: string;
  }): CloudFrontWebDistribution {
    const {
      distributionProps,
      lambdaMap,
      realtimeLogConfigArn,
      bucketLogging,
      secretsArn,
    } = props;
    const oai = distributionProps.originAccessIdentity
      ? new OriginAccessIdentity(
        this,
        `${distributionProps.environmentName}-oai`,
      )
      : undefined;
    const originConfigs = distributionProps.origins.map((d) =>
      createOriginConfig(this, d, oai, lambdaMap, secretsArn)
    );
    const distribution = createDistribution(this, {
      distributionProps,
      originConfigs,
      realtimeLogConfigArn,
      bucketLogging,
    });

    // cdk does not support viewerPolicy as it should
    // so collect map of policies and force them into cloudformation
    const viewerPolicies = this.getViewerPolicies(distributionProps.origins);

    if (Object.keys(viewerPolicies).length > 0) {
      const cfnDistribution = distribution.node.defaultChild as CfnDistribution;
      const distributionConfig = cfnDistribution
        .distributionConfig as CfnDistribution.DistributionConfigProperty;
      const behaviors = (distributionConfig.cacheBehaviors ??
        []) as CfnDistribution.CacheBehaviorProperty[];

      // handle all behaviors
      behaviors.forEach((cb: CfnDistribution.CacheBehaviorProperty) => {
        this.setViewerPolicy(cb, viewerPolicies, cb.pathPattern);

        // set CORS headers
        (cb as MutableCacheBehavior).responseHeadersPolicyId =
          ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS.responseHeadersPolicyId;

        // handle swagger
        if (cb.pathPattern === "swagger/*") {
          // for swagger, disable caching and set s3 cors policy
          (cb as MutableCacheBehavior).originRequestPolicyId =
            OriginRequestPolicy.CORS_S3_ORIGIN.originRequestPolicyId;
          (cb as MutableCacheBehavior).cachePolicyId =
            CachePolicy.CACHING_DISABLED.cachePolicyId;
        }
      });

      // and the default behavior
      this.setViewerPolicy(
        distributionConfig
          .defaultCacheBehavior as CfnDistribution.CacheBehaviorProperty,
        viewerPolicies,
        "*",
      );

      (distributionConfig.defaultCacheBehavior as MutableCacheBehavior)
        .responseHeadersPolicyId =
          ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS.responseHeadersPolicyId;
    }

    return distribution;
  }

  setViewerPolicy(
    behavior: CfnDistribution.CacheBehaviorProperty,
    viewerPolicyMap: ViewerPolicyMap,
    pathPattern: string,
  ): void {
    const viewerProtocolPolicy = viewerPolicyMap[pathPattern];

    if (viewerProtocolPolicy) {
      (behavior as MutablePolicy).viewerProtocolPolicy = viewerProtocolPolicy;
    }
  }

  getViewerPolicies(domains: CFOrigin[]): ViewerPolicyMap {
    const policyMap: ViewerPolicyMap = {};

    domains.forEach((d) => {
      d.behaviors.forEach((b) => {
        if (b.viewerProtocolPolicy) {
          policyMap[b.path] = b.viewerProtocolPolicy;
        }
      });
    });

    return policyMap;
  }
}
