import {Annotations, IAspect, Stack} from "aws-cdk-lib";
import {CfnFunction, Runtime} from 'aws-cdk-lib/aws-lambda';
import {CfnBucket} from "aws-cdk-lib/aws-s3";
import {DigitrafficStack, SOLUTION_KEY, StackConfiguration} from "./stack";
import {IConstruct} from "constructs";
import {CfnMethod, CfnResource} from "aws-cdk-lib/aws-apigateway";
import {paramCase, snakeCase} from "change-case";
import {CfnIntegration} from "aws-cdk-lib/aws-apigatewayv2";
import IntegrationProperty = CfnMethod.IntegrationProperty;

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

        this.checkStack(node);
        this.checkFunction(node);
        this.checkTags(node);
        this.checkBucket(node);
        this.checkResourceCasing(node);
    }

    checkStack(node: IConstruct) {
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

    checkFunction(node: IConstruct) {
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

    checkTags(node: IConstruct) {
        if (node instanceof Stack) {
            const s = node as Stack;

            if (!s.tags.tagValues()[SOLUTION_KEY]) {
                Annotations.of(node).addError('Solution tag is missing!');
            }
        }
    }

    checkBucket(node: IConstruct) {
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

    isValidPath(path: string) {
        return path.includes('{') || paramCase(path) === path;
    }

    isValidQueryString(name: string) {
        return snakeCase(name) === name;
    }

    checkResourceCasing(node: IConstruct) {
        if (node instanceof CfnResource) {
            const r = node as CfnResource;

            if (!this.isValidPath(r.pathPart)) {
                Annotations.of(node).addError(`Path part ${r.pathPart} needs to be in kebab-case`);
            }
        } else if (node instanceof CfnMethod) {
            const m = node as CfnMethod;
            const i = m.integration as IntegrationProperty;

            if (i && i.requestParameters) {
                Object.keys(i.requestParameters).forEach(key => {
                    const split = key.split('.');
                    const type = split[2];
                    const name = split[3];

                    if (type === 'querystring' && !this.isValidQueryString(name)) {
                        Annotations.of(node).addError(`Querystring ${name} needs to be in snake case`);
                    }
                });
            }
        }
    }
}
