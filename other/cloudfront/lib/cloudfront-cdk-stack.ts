import {CfnDistribution, OriginAccessIdentity} from 'aws-cdk-lib/aws-cloudfront';
import {CompositePrincipal, ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {Construct} from "constructs";
import {Annotations, Aspects, Stack, StackProps} from "aws-cdk-lib";
import {createOriginConfig} from "./origin-configs";
import {CFOrigin, CFLambdaParameters, CFProps, ElasticProps, DistributionProps} from './app-props';
import {
    createGzipRequirement,
    createHttpHeaders, createIndexHtml,
    createIpRestriction,
    createWeathercamRedirect, FunctionType,
    LambdaType,
} from "./lambda/lambda-creator";
import {createDistribution} from "./distribution-util";
import {createRealtimeLogging, StreamingConfig} from "./streaming-util";
import {StackCheckingAspect} from "digitraffic-common/aws/infra/stack/stack-checking-aspect";
import {LambdaHolder} from "./lambda-holder";

type ViewerPolicyMap = {
    [key: string]: string,
};

type MutablePolicy = {
    viewerProtocolPolicy: string
}

export class CloudfrontCdkStack extends Stack {
    constructor(scope: Construct, id: string, cloudfrontProps: CFProps, props?: StackProps) {
        super(scope, id, props);

        this.validateDefaultBehaviors(cloudfrontProps.distributions);

        const lambdaMap = this.createLambdaMap(cloudfrontProps.distributions, cloudfrontProps.lambdaParameters);
        const writeToESROle = this.createWriteToESRole(this, cloudfrontProps.elasticProps);
        const streamingConfig = createRealtimeLogging(this, writeToESROle, cloudfrontProps.elasticAppName, cloudfrontProps.elasticProps);

        cloudfrontProps.distributions.forEach(p => this.createDistribution(
            p, writeToESROle, lambdaMap, streamingConfig, cloudfrontProps,
        ));

        Aspects.of(this).add(new StackCheckingAspect());
    }

    validateDefaultBehaviors(props: DistributionProps[]) {
        props.forEach(distribution => {
            // check default behaviors
            const defaults = distribution.origins.flatMap(d => d.behaviors)
                .filter(b => b.path === "*");

            if (defaults.length === 0) {
                Annotations.of(this).addError("no defaults for " + distribution.distributionName);
            } else if (defaults.length > 1) {
                Annotations.of(this).addError("multiple defaults for " + distribution.distributionName);
                console.error("defaults:%s", defaults);
            }
        });
    }

    createWriteToESRole(stack: Construct, elasticProps: ElasticProps) {
        const lambdaRole = new Role(stack, `WriteToElasticRole`, {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            roleName: `WriteToElasticRole`,
        });
        lambdaRole.addToPolicy(new PolicyStatement({
            actions: [
                "es:DescribeElasticsearchDomain",
                "es:DescribeElasticsearchDomains",
                "es:DescribeElasticsearchDomainConfig",
                "es:ESHttpPost",
                "es:ESHttpPut",
                "es:ESHttpGet",
            ],
            resources: [
                elasticProps.elasticArn,
                `${elasticProps.elasticArn}/*`,
            ],
        }));
        lambdaRole.addToPolicy(new PolicyStatement( {
            actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
            ],
            resources: [
                "arn:aws:logs:*:*:*",
            ],
        }));

        return lambdaRole;
    }

    findLambdaTypes(props: DistributionProps[]) {
        const lambdaTypes = new Set();
        const functionTypes = new Set();
        const ipRestrictions = new Set<string>();

        props.flatMap(p => p.origins)
            .flatMap(d => d.behaviors)
            .forEach(b => {
                b.lambdaTypes.forEach(type => lambdaTypes.add(type));
                b.functionTypes.forEach(type => functionTypes.add(type));
                if (b.ipRestriction) {
                    ipRestrictions.add(b.ipRestriction);
                }
            });

        return {lambdaTypes, functionTypes, ipRestrictions};
    }

    createLambdaMap(props: DistributionProps[], lParameters: CFLambdaParameters | undefined): LambdaHolder {
        const lambdaMap = new LambdaHolder();

        const types = this.findLambdaTypes(props);

        const edgeLambdaRole = new Role(this, 'edgeLambdaRole', {
            assumedBy: new CompositePrincipal(new ServicePrincipal("lambda.amazonaws.com"),
                new ServicePrincipal("edgelambda.amazonaws.com")),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
            ],
        });

        if (types.lambdaTypes.has(LambdaType.WEATHERCAM_REDIRECT)) {
            if (!lParameters?.weathercamDomainName) {
                throw new Error("Missing lambdaParameter weathercamDomainName");
            } else if (!lParameters?.weathercamHostName) {
                throw new Error("Missing lambdaParameter weathercamHostName");
            } else {
                lambdaMap.addLambda(LambdaType.WEATHERCAM_REDIRECT,
                    createWeathercamRedirect(this, edgeLambdaRole, lParameters.weathercamDomainName!, lParameters.weathercamHostName!));
            }
        }

        if (types.lambdaTypes.has(LambdaType.GZIP_REQUIREMENT)) {
            lambdaMap.addLambda(LambdaType.GZIP_REQUIREMENT, createGzipRequirement(this, edgeLambdaRole));
        }

        if (types.lambdaTypes.has(LambdaType.HTTP_HEADERS)) {
            lambdaMap.addLambda(LambdaType.HTTP_HEADERS, createHttpHeaders(this, edgeLambdaRole));
        }

        if (types.functionTypes.has(FunctionType.INDEX_HTML)) {
            lambdaMap.addFunction(FunctionType.INDEX_HTML, createIndexHtml(this, edgeLambdaRole));
        }

        // handle ip restrictions
        const ipRestrictions = lParameters?.ipRestrictions;

        types.ipRestrictions.forEach(key => {
            if (ipRestrictions && ipRestrictions[key]) {
                lambdaMap.addRestriction(key, createIpRestriction(this, edgeLambdaRole, key, ipRestrictions[key]));
            } else {
                throw new Error("missing lambdaParameter ip restriction " + key);
            }
        });

        return lambdaMap;
    }

    createDistribution(
        distributionProps: DistributionProps, role: Role, lambdaMap: LambdaHolder, streamingConfig: StreamingConfig, cloudfrontProps: CFProps,
    ) {
        const oai = distributionProps.originAccessIdentity ? new OriginAccessIdentity(this, `${distributionProps.environmentName}-oai`) : null;
        const originConfigs = distributionProps.origins.map(d => createOriginConfig(this, d, oai, lambdaMap));
        const distribution = createDistribution(
            this, distributionProps, originConfigs, role, cloudfrontProps, streamingConfig,
        );

        // cdk does not support viewerPolicy as it should
        // so collect map of policies and force them into cloudformation
        const viewerPolicies = this.getViewerPolicies(distributionProps.origins);

        if (Object.keys(viewerPolicies).length > 0) {
            const cfnDistribution = distribution.node.defaultChild as CfnDistribution;
            const distributionConfig = cfnDistribution.distributionConfig as CfnDistribution.DistributionConfigProperty;
            const behaviors = distributionConfig?.cacheBehaviors as CfnDistribution.CacheBehaviorProperty[];

            // handle all behaviors
            behaviors?.forEach((cb: CfnDistribution.CacheBehaviorProperty) => {
                this.setViewerPolicy(cb, viewerPolicies, cb.pathPattern);
            });

            // and the default behavior
            this.setViewerPolicy(distributionConfig.defaultCacheBehavior as CfnDistribution.CacheBehaviorProperty, viewerPolicies, '*');
        }

        return distribution;
    }

    setViewerPolicy(behavior: CfnDistribution.CacheBehaviorProperty, viewerPolicyMap: ViewerPolicyMap, pathPattern: string) {
        const viewerProtocolPolicy = viewerPolicyMap[pathPattern];

        if (viewerProtocolPolicy) {
            (behavior as MutablePolicy).viewerProtocolPolicy = viewerProtocolPolicy;
        }
    }

    getViewerPolicies(domains: CFOrigin[]): ViewerPolicyMap {
        const policyMap: ViewerPolicyMap = {};

        domains.forEach(d => {
            d.behaviors?.forEach(b => {
                if (b.viewerProtocolPolicy != null) {
                    policyMap[b.path] = b.viewerProtocolPolicy;
                }
            });
        });

        return policyMap;
    }
}
