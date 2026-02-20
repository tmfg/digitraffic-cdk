import type { StackProps } from "aws-cdk-lib";
import { Stack } from "aws-cdk-lib";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Topic } from "aws-cdk-lib/aws-sns";
import {
  CfnMaintenanceWindow,
  CfnMaintenanceWindowTarget,
  CfnMaintenanceWindowTask,
} from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import type { Props } from "./app-props.js";

export class PatchManagerStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    appProps: Props,
    props?: StackProps,
  ) {
    super(scope, id, props);

    // create a maintenance window with a schedule
    const maintenanceWindowName = "UpdateEC2Window";
    const maintenanceWindow = new CfnMaintenanceWindow(
      this,
      maintenanceWindowName,
      {
        name: maintenanceWindowName,
        allowUnassociatedTargets: false,
        duration: 2, // hours
        cutoff: 1, // hours
        schedule: appProps.maintenanceWindowCron,
      },
    );

    // register maintenance window targets, i.e. EC2 instances by ids
    const maintenanceWindowTargetName = "UpdateEC2WindowTargets";
    const maintenanceWindowTarget = new CfnMaintenanceWindowTarget(
      this,
      maintenanceWindowTargetName,
      {
        name: maintenanceWindowTargetName,
        resourceType: "INSTANCE",
        windowId: maintenanceWindow.ref,
        targets: [
          {
            key: "InstanceIds",
            values: appProps.instanceIds,
          },
        ],
      },
    );

    const snsTopic = Topic.fromTopicArn(
      this,
      "snsTopic",
      appProps.notificationArn,
    );
    const snsRole = new Role(this, "snsRole", {
      assumedBy: new ServicePrincipal("ssm.amazonaws.com"),
    });
    snsTopic.grantPublish(snsRole);

    // create a task to install patch base line updates to target EC2 instances
    const maintenanceWindowTaskName = "UpdateEC2Task";
    new CfnMaintenanceWindowTask(this, maintenanceWindowTaskName, {
      name: maintenanceWindowTaskName,
      maxConcurrency: "1",
      maxErrors: "1",
      priority: 0,
      taskArn: "AWS-RunPatchBaseline",
      taskInvocationParameters: {
        maintenanceWindowRunCommandParameters: {
          serviceRoleArn: snsRole.roleArn,
          notificationConfig: {
            notificationArn: appProps.notificationArn,
            notificationEvents: ["TimedOut", "Cancelled", "Failed"],
            notificationType: "Command", // status of whole command, not per-instance
          },
          parameters: {
            Operation: ["Install"],
          },
        },
      },
      taskType: "RUN_COMMAND",
      windowId: maintenanceWindow.ref,
      targets: [
        {
          key: "WindowTargetIds",
          values: [maintenanceWindowTarget.ref],
        },
      ],
    });
  }
}
