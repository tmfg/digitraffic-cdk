import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { type PortCallStack } from "./port-call-stack.js";
import {
    MonitoredDBFunction,
    type MonitoredFunction
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";

export class InternalLambdas {
    constructor(stack: PortCallStack) {
        const updateLambda = this.createUpdateLambda(stack);

        Scheduler.everyMinutes(stack, "UpdateVisits", 10, updateLambda);
    }

    createUpdateLambda(stack: PortCallStack): MonitoredFunction {    
        return MonitoredDBFunction.create(stack, "update-visits");
    }
    
}