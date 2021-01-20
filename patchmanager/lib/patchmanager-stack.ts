import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {Props} from './app-props'
import {CfnMaintenanceWindow, CfnMaintenanceWindowTarget, CfnMaintenanceWindowTask} from "@aws-cdk/aws-ssm";

export class PatchManagerStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        // create a maintenance window with a schedule
        const maintenanceWindowName = 'UpdateEC2Window';
        const maintenanceWindow = new CfnMaintenanceWindow(this, maintenanceWindowName, {
            name: maintenanceWindowName,
            allowUnassociatedTargets: false,
            duration: 2, // hours
            cutoff: 1, // hours
            schedule: appProps.maintenanceWindowCron
        });

        // register maintenance window targets, i.e. EC2 instances by ids
        const maintenanceWindowTargetName = 'UpdateEC2WindowTargets';
        const maintenanceWindowTarget = new CfnMaintenanceWindowTarget(this, maintenanceWindowTargetName, {
            name: maintenanceWindowTargetName,
            resourceType: 'INSTANCE',
            windowId: maintenanceWindow.ref,
            targets: [
                {
                    key: 'InstanceIds',
                    values: appProps.instanceIds
                }
            ]
        });

        // create a task to install patch base line updates to target EC2 instances
        const maintenanceWindowTaskName = 'UpdateEC2Task'
        new CfnMaintenanceWindowTask(this, maintenanceWindowTaskName, {
            name: maintenanceWindowTaskName,
            maxConcurrency: '1',
            maxErrors: '1',
            priority: 0,
            taskArn: 'AWS-RunPatchBaseline',
            taskInvocationParameters: {
                maintenanceWindowRunCommandParameters: {
                    parameters: {
                        Operation: ['Install']
                    }
                }
            },
            taskType: 'RUN_COMMAND',
            windowId: maintenanceWindow.ref,
            targets: [
                {
                    key: 'WindowTargetIds',
                    values: [maintenanceWindowTarget.ref]
                }
            ]
        });

    }
}
