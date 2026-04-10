import type { Stack } from "aws-cdk-lib";
import { CfnOutput, Fn } from "aws-cdk-lib";
import type { IVpc } from "aws-cdk-lib/aws-ec2";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import type { Construct } from "constructs";

/**
 * Import VPC from other stack outputs
 */
export function importVpc(scope: Construct, environmentName: string): IVpc {
  const vpcId = importValue(environmentName, "VPCID");
  const privateSubnetIds = [
    importValue(environmentName, "digitrafficprivateASubnet"),
    importValue(environmentName, "digitrafficprivateBSubnet"),
  ];
  const availabilityZones = ["euw1-az1", "euw1-az2"];

  // VPC reference construction requires vpcId and availability zones
  // private subnets are used in Lambda configuration
  return Vpc.fromVpcAttributes(scope, "vpc", {
    vpcId,
    privateSubnetIds,
    availabilityZones,
  });
}

/**
 * Import value from other stack output.  Stack outputs are named with
 * digitraffic-${environmentName}-${name} pattern and this function takes care of it
 */
export function importValue(environmentName: string, name: string): string {
  return Fn.importValue(outputName(environmentName, name));
}

/**
 * Export value as stack output.  Use same naming pattern as importValue.
 */
export function exportValue(
  stack: Stack,
  environmentName: string,
  name: string,
  value: string,
): void {
  const exportName = outputName(environmentName, name);

  new CfnOutput(stack, exportName, {
    exportName,
    value,
  });
}

export function outputName(environmentName: string, name: string): string {
  return `digitraffic-${environmentName}-${name}`;
}
