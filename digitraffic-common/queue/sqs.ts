import {Queue, QueueProps} from "@aws-cdk/aws-sqs";
import {Construct} from "@aws-cdk/core";
import {DigitrafficStack} from "../stack/stack";

export class DigitrafficSqsQueue extends Queue {
    constructor(scope: Construct, name: string, props: QueueProps) {
        super(scope, name, props);
    }

    static create(stack: DigitrafficStack, name: string, props: QueueProps) {
        return new DigitrafficSqsQueue(stack, `${stack.configuration.shortName}-${name}`, props);
    }
}
