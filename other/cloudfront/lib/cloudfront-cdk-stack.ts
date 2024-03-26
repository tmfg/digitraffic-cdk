import { StackCheckingAspect } from "@digitraffic/common/dist/aws/infra/stack/stack-checking-aspect";
import { Annotations, Aspects, Stack, StackProps } from "aws-cdk-lib";
import {
    CachePolicy,
    CfnDistribution,
    CloudFrontWebDistribution,
    OriginAccessIdentity,
    OriginRequestPolicy,
    ResponseHeadersPolicy
} from "aws-cdk-lib/aws-cloudfront";
import { CompositePrincipal, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { CFLambdaParameters, CFOrigin, CFProps, DistributionProps, ElasticProps } from "./app-props";
import { createDistribution } from "./distribution-util";
import { LambdaHolder } from "./lambda-holder";
import {
    createGzipRequirement, createHistoryPath,
    createHttpHeaders,
    createIndexHtml,
    createIpRestriction,
    createLamHeaders,
    createLamRedirect,
    createWeathercamHttpHeaders,
    createWeathercamRedirect,
    FunctionType,
    LambdaType
} from "./lambda/lambda-creator";
import { createOriginConfig } from "./origin-configs";
import { createRealtimeLogging } from "./streaming-util";

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
}

export class CloudfrontCdkStack extends Stack {
    constructor(scope: Construct, id: string, cloudfrontProps: CFProps, props?: StackProps) {
        super(scope, id, props);

        const { distributions, lambdaParameters, bucketLogging, secretsArn } = cloudfrontProps;

        this.validateDefaultBehaviors(distributions);

        const lambdaMap = this.createLambdaMap(distributions, lambdaParameters);
        const realtimeLogConfigArn = this.getLogConfigArn(cloudfrontProps);

        distributions.forEach((distributionProps) =>
            this.createDistribution({
                distributionProps,
                lambdaMap,
                realtimeLogConfigArn,
                bucketLogging,
                secretsArn
            })
        );

        Aspects.of(this).add(new StackCheckingAspect());
    }

    getLogConfigArn(cloudfrontProps: CFProps): string {
        if (cloudfrontProps.realtimeLogConfigArn) {
            return cloudfrontProps.realtimeLogConfigArn;
        }

        if (!cloudfrontProps.elasticProps) {
            throw new Error("ElasticProps missing from " + cloudfrontProps.elasticAppName);
        }

        const writeToESRole = this.createWriteToESRole(this, cloudfrontProps.elasticProps);

        return createRealtimeLogging(
            this,
            writeToESRole,
            cloudfrontProps.elasticAppName,
            cloudfrontProps.elasticProps
        ).loggingConfig.attrArn;
    }

    validateDefaultBehaviors(props: DistributionProps[]): void {
        props.forEach((distribution) => {
            // check default behaviors
            const defaults = distribution.origins.flatMap((d) => d.behaviors).filter((b) => b.path === "*");

            if (defaults.length === 0) {
                Annotations.of(this).addError("no defaults for " + distribution.distributionName);
            } else if (defaults.length > 1) {
                Annotations.of(this).addError("multiple defaults for " + distribution.distributionName);
                console.error("defaults:%s", defaults);
            }
        });
    }

    createWriteToESRole(stack: Construct, elasticProps: ElasticProps): Role {
        const lambdaRole = new Role(stack, "WriteToElasticRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            roleName: "WriteToElasticRole"
        });
        lambdaRole.addToPolicy(
            new PolicyStatement({
                actions: [
                    "es:DescribeElasticsearchDomain",
                    "es:DescribeElasticsearchDomains",
                    "es:DescribeElasticsearchDomainConfig",
                    "es:ESHttpPost",
                    "es:ESHttpPut",
                    "es:ESHttpGet"
                ],
                resources: [elasticProps.elasticArn, `${elasticProps.elasticArn}/*`]
            })
        );
        lambdaRole.addToPolicy(
            new PolicyStatement({
                actions: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                resources: ["arn:aws:logs:*:*:*"]
            })
        );

        return lambdaRole;
    }

    findLambdaTypes(props: DistributionProps[]): LambdaTypes {
        const lambdaTypes = new Set<LambdaType>();
        const functionTypes = new Set<FunctionType>();
        const ipRestrictions = new Set<string>();

        props
            .flatMap((p) => p.origins)
            .flatMap((d) => d.behaviors)
            .forEach((b) => {
                b.lambdaTypes.forEach((type) => lambdaTypes.add(type));
                b.functionTypes.forEach((type) => functionTypes.add(type));
                if (b.ipRestriction) {
                    ipRestrictions.add(b.ipRestriction);
                }
            });

        return { lambdaTypes, functionTypes, ipRestrictions };
    }

    createLambdaMap(props: DistributionProps[], lParameters: CFLambdaParameters | undefined): LambdaHolder {
        const lambdaMap = new LambdaHolder();

        const types = this.findLambdaTypes(props);

        const edgeLambdaRole = new Role(this, "edgeLambdaRole", {
            assumedBy: new CompositePrincipal(
                new ServicePrincipal("lambda.amazonaws.com"),
                new ServicePrincipal("edgelambda.amazonaws.com")
            ),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
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
                        lParameters.weathercamHostName
                    )
                );
            }
        }

        if (types.lambdaTypes.has(LambdaType.WEATHERCAM_HTTP_HEADERS)) {
            lambdaMap.addLambda(
                LambdaType.WEATHERCAM_HTTP_HEADERS,
                createWeathercamHttpHeaders(this, edgeLambdaRole)
            );
        }

        if (types.lambdaTypes.has(LambdaType.GZIP_REQUIREMENT)) {
            lambdaMap.addLambda(LambdaType.GZIP_REQUIREMENT, createGzipRequirement(this, edgeLambdaRole));
        }

        if (types.lambdaTypes.has(LambdaType.HTTP_HEADERS)) {
            lambdaMap.addLambda(LambdaType.HTTP_HEADERS, createHttpHeaders(this, edgeLambdaRole));
        }

        if (types.lambdaTypes.has(LambdaType.LAM_REDIRECT)) {
            if (!lParameters?.smRef) {
                throw new Error("Missing lambdaParameter smRef");
            } else {
                lambdaMap.addLambda(
                    LambdaType.LAM_REDIRECT,
                    createLamRedirect(this, edgeLambdaRole, lParameters.smRef)
                );
            }
        }

        if (types.lambdaTypes.has(LambdaType.LAM_HEADERS)) {
            lambdaMap.addLambda(LambdaType.LAM_HEADERS, createLamHeaders(this, edgeLambdaRole));
        }

        if (types.functionTypes.has(FunctionType.INDEX_HTML)) {
            lambdaMap.addFunction(FunctionType.INDEX_HTML, createIndexHtml(this));
        }

        if (types.functionTypes.has(FunctionType.HISTORY_SLASH)) {
            lambdaMap.addFunction(FunctionType.HISTORY_SLASH, createHistoryPath(this))
        }

        // handle ip restrictions
        const ipRestrictions = lParameters?.ipRestrictions;

        types.ipRestrictions.forEach((key) => {
            if (ipRestrictions && ipRestrictions[key]) {
                lambdaMap.addRestriction(
                    key,
                    createIpRestriction(this, edgeLambdaRole, key, ipRestrictions[key])
                );
            } else {
                throw new Error("missing lambdaParameter ip restriction " + key);
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
        const { distributionProps, lambdaMap, realtimeLogConfigArn, bucketLogging, secretsArn } = props;
        const oai = distributionProps.originAccessIdentity
            ? new OriginAccessIdentity(this, `${distributionProps.environmentName}-oai`)
            : undefined;
        const originConfigs = distributionProps.origins.map((d) =>
            createOriginConfig(this, d, oai, lambdaMap, secretsArn)
        );
        const distribution = createDistribution(this, {
            distributionProps,
            originConfigs,
            realtimeLogConfigArn,
            bucketLogging
        });

        // cdk does not support viewerPolicy as it should
        // so collect map of policies and force them into cloudformation
        const viewerPolicies = this.getViewerPolicies(distributionProps.origins);

        if (Object.keys(viewerPolicies).length > 0) {
            const cfnDistribution = distribution.node.defaultChild as CfnDistribution;
            const distributionConfig =
                cfnDistribution.distributionConfig as CfnDistribution.DistributionConfigProperty;
            const behaviors = (distributionConfig.cacheBehaviors ??
                []) as CfnDistribution.CacheBehaviorProperty[];

            // handle all behaviors
            behaviors.forEach((cb: CfnDistribution.CacheBehaviorProperty) => {
                this.setViewerPolicy(cb, viewerPolicies, cb.pathPattern);

                // set CORS headers
                (cb as MutableCacheBehavior).responseHeadersPolicyId =
                    ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS.responseHeadersPolicyId;

                // handle swagger
                if (cb.pathPattern.includes("swagger")) {
                    // for swagger, disable caching and set s3 cors policy
                    (cb as MutableCacheBehavior).originRequestPolicyId =
                        OriginRequestPolicy.CORS_S3_ORIGIN.originRequestPolicyId;
                    (cb as MutableCacheBehavior).cachePolicyId = CachePolicy.CACHING_DISABLED.cachePolicyId;
                }
            });

            // and the default behavior
            this.setViewerPolicy(
                distributionConfig.defaultCacheBehavior as CfnDistribution.CacheBehaviorProperty,
                viewerPolicies,
                "*"
            );

            (distributionConfig.defaultCacheBehavior as MutableCacheBehavior).responseHeadersPolicyId =
                ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS.responseHeadersPolicyId;
        }

        return distribution;
    }

    setViewerPolicy(
        behavior: CfnDistribution.CacheBehaviorProperty,
        viewerPolicyMap: ViewerPolicyMap,
        pathPattern: string
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
