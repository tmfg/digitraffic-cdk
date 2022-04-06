import {Annotations, IAspect, Stack} from "aws-cdk-lib";
import {CfnFunction, Runtime} from 'aws-cdk-lib/aws-lambda';
import {CfnBucket} from "aws-cdk-lib/aws-s3";
import {DigitrafficStack, SOLUTION_KEY, StackConfiguration} from "./stack";
import {IConstruct} from "constructs";
import {CfnMethod, CfnResource} from "aws-cdk-lib/aws-apigateway";
import {paramCase, snakeCase} from "change-case";
import IntegrationProperty = CfnMethod.IntegrationProperty;
import {CfnQueue} from "aws-cdk-lib/aws-sqs";
import {LogRetention} from "aws-cdk-lib/aws-logs";

const MAX_CONCURRENCY_LIMIT = 100;
const NODE_RUNTIME = Runtime.NODEJS_14_X.name;

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

        StackCheckingAspect.checkStack(node);
        this.checkFunction(node);
        StackCheckingAspect.checkTags(node);
        StackCheckingAspect.checkBucket(node);
        this.checkResourceCasing(node);
        StackCheckingAspect.checkQueueEncryption(node);
        StackCheckingAspect.checkLogGroupRetention(node);
    }

    private static checkStack(node: IConstruct) {
        if (node instanceof DigitrafficStack) {
            const s = node as DigitrafficStack;

            if ((s.stackName.includes('Test') || s.stackName.includes('Tst')) && s.configuration?.production) {
                Annotations.of(node).addError("Production is set for Test-stack");
            }

            if ((s.stackName.includes('Prod') || s.stackName.includes('Prd')) && !s.configuration?.production) {
                Annotations.of(node).addError("Production is not set for Production-stack");
            }
        }
    }

    private checkFunction(node: IConstruct) {
        if (node instanceof CfnFunction) {
            const f = node as CfnFunction;

            if (!f.reservedConcurrentExecutions) {
                Annotations.of(node).addError('no reservedConcurrentConcurrency!');
            } else if (f.reservedConcurrentExecutions > MAX_CONCURRENCY_LIMIT) {
                Annotations.of(node).addError('reservedConcurrentConcurrency too high!');
            }

            if (!f.timeout) {
                Annotations.of(node).addError("no timeout!");
            }

            if (!f.memorySize) {
                Annotations.of(node).addError("no memorySize!");
            }

            if (f.runtime !== NODE_RUNTIME) {
                Annotations.of(node).addWarning('wrong runtime ' + f.runtime);
            }

            if (this.configuration?.shortName && f.functionName && f.functionName.indexOf(this.configuration.shortName) != 0) {
                Annotations.of(node).addWarning('Function name does not begin with ' + this.configuration.shortName);
            }
        }
    }

    private static checkTags(node: IConstruct) {
        if (node instanceof Stack) {
            const s = node as Stack;

            if (!s.tags.tagValues()[SOLUTION_KEY]) {
                Annotations.of(node).addError('Solution tag is missing!');
            }
        }
    }

    private static checkBucket(node: IConstruct) {
        if (node instanceof CfnBucket) {
            const b = node as CfnBucket;
            const c = b.publicAccessBlockConfiguration as CfnBucket.PublicAccessBlockConfigurationProperty;

            if (c) {
                if (!c.blockPublicAcls || !c.blockPublicPolicy || !c.ignorePublicAcls || !c.restrictPublicBuckets) {
                    Annotations.of(node).addError('Check bucket publicity');
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
            const resource = node as CfnResource;

            if (!StackCheckingAspect.isValidPath(resource.pathPart)) {
                Annotations.of(node).addWarning(`Path part ${resource.pathPart} should be in kebab-case`);
            }
        } else if (node instanceof CfnMethod) {
            const method = node as CfnMethod;
            const integration = method.integration as IntegrationProperty;

            if (integration && integration.requestParameters) {
                Object.keys(integration.requestParameters).forEach(key => {
                    const split = key.split('.');
                    const type = split[2];
                    const name = split[3];

                    if (type === 'querystring' && !StackCheckingAspect.isValidQueryString(name)) {
                        Annotations.of(node).addWarning(`Querystring ${name} should be in snake_case`);
                    }
                });
            }
        }
    }

    private static checkQueueEncryption(node: IConstruct) {
        if (node instanceof CfnQueue) {
            const queue = node as CfnQueue;

            if (!queue.kmsMasterKeyId) {
                Annotations.of(node).addError('Queue must have encryption enabled');
            }
        }
    }

    private static checkLogGroupRetention(node: IConstruct) {
        if (node instanceof LogRetention) {
            const child = node.node.defaultChild as unknown as Record<string, Record<string, string>>;
            const retention = child._cfnProperties.RetentionInDays;

            if (!retention) {
                Annotations.of(node).addError(`Log group ${node.node.path} must define log group retention`);
            }
        }
    }
}
