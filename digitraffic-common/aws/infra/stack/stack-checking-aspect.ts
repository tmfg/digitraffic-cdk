import {Annotations, IAspect, Stack} from "aws-cdk-lib";
import {CfnFunction, Runtime} from 'aws-cdk-lib/aws-lambda';
import {CfnBucket} from "aws-cdk-lib/aws-s3";
import {DigitrafficStack, SOLUTION_KEY, StackConfiguration} from "./stack";
import {IConstruct} from "constructs";
import {CfnMethod, CfnResource} from "aws-cdk-lib/aws-apigateway";
import {paramCase, snakeCase} from "change-case";
import {CfnQueue} from "aws-cdk-lib/aws-sqs";
import {LogRetention} from "aws-cdk-lib/aws-logs";
import IntegrationProperty = CfnMethod.IntegrationProperty;

const MAX_CONCURRENCY_LIMIT = 100;
const NODE_RUNTIME = Runtime.NODEJS_14_X.name;

enum ResourceType {
    stackName = "STACK_NAME",
    reservedConcurrentConcurrency = "RESERVED_CONCURRENT_CONCURRENCY",
    functionTimeout = "FUNCTION_TIMEOUT",
    functionMemorySize = "FUNCTION_MEMORY_SIZE",
    functionRuntime = "FUNCTION_RUNTIME",
    functionName = "FUNCTION_NAME",
    tagSolution = "TAG_SOLUTION",
    bucketPublicity = "BUCKET_PUBLICITY",
    resourcePath = "RESOURCE_PATH",
    queueEncryption = "QUEUE_ENCRYPTION",
    logGroupRetention = "LOG_GROUP_RETENTION",
}

export class StackCheckingAspect implements IAspect {
    private readonly configuration?: StackConfiguration;

    constructor(configuration?: StackConfiguration) {
        this.configuration = configuration;
    }

    static create(stack: DigitrafficStack) {
        return new StackCheckingAspect(stack.configuration);
    }

    public visit(node: IConstruct): void {
        //console.info("visiting class " + node.constructor.name);

        this.checkStack(node);
        this.checkFunction(node);
        this.checkTags(node);
        this.checkBucket(node);
        this.checkResourceCasing(node);
        this.checkQueueEncryption(node);
        this.checkLogGroupRetention(node);
    }

    private isWhitelisted(key: string) {
        return this?.configuration?.whitelistedResources?.some(wl => {
            return key.matchAll(new RegExp(wl, 'g'));
        });
    }

    private addAnnotation(node: IConstruct, key: ResourceType | string, message: string, isError = true) {
        const resourceKey = `${node.node.path}/${key}`;
        const isWhiteListed = this.isWhitelisted(resourceKey);
        const annotationMessage = `${resourceKey}:${message}`;

        // error && whitelisted -> warning
        // warning && whitelisted -> nothing
        if (isError && !isWhiteListed) {
            Annotations.of(node).addError(annotationMessage);
        } else if ((!isError && !isWhiteListed) || (isError && isWhiteListed)) {
            Annotations.of(node).addWarning(annotationMessage);
        }
    }

    private checkStack(node: IConstruct) {
        if (node instanceof DigitrafficStack) {
            if ((node.stackName.includes('Test') || node.stackName.includes('Tst')) && node.configuration?.production) {
                this.addAnnotation(node, ResourceType.stackName, 'Production is set for Test-stack');
            }

            if ((node.stackName.includes('Prod') || node.stackName.includes('Prd')) && !node.configuration?.production) {
                this.addAnnotation(node, ResourceType.stackName, 'Production is not set for Production-stack');
            }
        }
    }

    private checkFunction(node: IConstruct) {
        if (node instanceof CfnFunction) {
            if (!node.reservedConcurrentExecutions) {
                this.addAnnotation(node, ResourceType.reservedConcurrentConcurrency, 'Function must have reservedConcurrentConcurrency');
            } else if (node.reservedConcurrentExecutions > MAX_CONCURRENCY_LIMIT) {
                this.addAnnotation(node, ResourceType.reservedConcurrentConcurrency, 'Function reservedConcurrentConcurrency too high!');
            }

            if (!node.timeout) {
                this.addAnnotation(node, ResourceType.functionTimeout, 'Function must have timeout');
            }

            if (!node.memorySize) {
                this.addAnnotation(node, ResourceType.functionMemorySize, 'Function must have memorySize');
            }

            if (node.runtime !== NODE_RUNTIME) {
                this.addAnnotation(node, ResourceType.functionRuntime,'wrong runtime ' + node.runtime);
            }

            if (this.configuration?.shortName && node.functionName && node.functionName.indexOf(this.configuration.shortName) != 0) {
                this.addAnnotation(node, ResourceType.functionName, 'Function name does not begin with ' + this.configuration.shortName);
            }
        }
    }

    private checkTags(node: IConstruct) {
        if (node instanceof Stack) {
            if (!node.tags.tagValues()[SOLUTION_KEY]) {
                this.addAnnotation(node, ResourceType.tagSolution, 'Solution tag is missing');
            }
        }
    }

    private checkBucket(node: IConstruct) {
        if (node instanceof CfnBucket) {
            const c = node.publicAccessBlockConfiguration as CfnBucket.PublicAccessBlockConfigurationProperty;

            if (c) {
                if (!c.blockPublicAcls || !c.blockPublicPolicy || !c.ignorePublicAcls || !c.restrictPublicBuckets) {
                    this.addAnnotation(node, ResourceType.bucketPublicity, 'Check bucket publicity');
                }
            }
        }
    }

    private static isValidPath(path: string): boolean {
        // if path includes . or { check only the trailing part of path
        if (path.includes('.')) {
            return this.isValidPath(path.split('.')[0]);
        }

        if (path.includes('{')) {
            return this.isValidPath(path.split('{')[0]);
        }

        return paramCase(path) === path;
    }

    private static isValidQueryString(name: string) {
        return snakeCase(name) === name;
    }

    private checkResourceCasing(node: IConstruct) {
        if (node instanceof CfnResource) {
            if (!StackCheckingAspect.isValidPath(node.pathPart)) {
                this.addAnnotation(node, ResourceType.resourcePath, 'Path part should be in kebab-case');
            }
        } else if (node instanceof CfnMethod) {
            const integration = node.integration as IntegrationProperty;

            if (integration && integration.requestParameters) {
                Object.keys(integration.requestParameters).forEach(key => {
                    const split = key.split('.');
                    const type = split[2];
                    const name = split[3];

                    if (type === 'querystring' && !StackCheckingAspect.isValidQueryString(name)) {
                        this.addAnnotation(node, name, 'Querystring should be in snake_case');
                    }
                });
            }
        }
    }

    private checkQueueEncryption(node: IConstruct) {
        if (node instanceof CfnQueue) {
            if (!node.kmsMasterKeyId) {
                this.addAnnotation(node, ResourceType.queueEncryption, 'Queue must have encryption enabled');
            }
        }
    }

    private checkLogGroupRetention(node: IConstruct) {
        if (node instanceof LogRetention) {
            const child = node.node.defaultChild as unknown as Record<string, Record<string, string>>;
            const retention = child._cfnProperties.RetentionInDays;

            if (!retention) {
                this.addAnnotation(node, ResourceType.logGroupRetention, 'Log group must define log group retention');
            }
        }
    }
}
