import type { IVpc } from "aws-cdk-lib/aws-ec2";
import { CfnRoute, IpAddresses, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Stack } from "aws-cdk-lib/core";
import type { Construct } from "constructs/lib/construct.js";
import { exportValue } from "../import-util.js";
import type { InfraStackConfiguration } from "./intra-stack-configuration.js";

export interface NetworkConfiguration {
  readonly vpcName: string;
  readonly cidr: string;
  readonly transitGatewayId?: string;
}

/** Creates a network stack with VPC and optional transit gateway routing */
export class NetworkStack extends Stack {
  readonly vpc: IVpc;

  constructor(
    scope: Construct,
    id: string,
    isc: InfraStackConfiguration,
    configuration: NetworkConfiguration,
  ) {
    super(scope, id, {
      env: isc.env,
    });

    this.vpc = this.createVpc(configuration);

    if (
      this.vpc.publicSubnets[0] === undefined ||
      this.vpc.publicSubnets[1] === undefined ||
      this.vpc.privateSubnets[0] === undefined ||
      this.vpc.privateSubnets[1] === undefined
    ) {
      throw Error("Subnets are not set correctly");
    }

    exportValue(this, isc.environmentName, "VPCID", this.vpc.vpcId);
    exportValue(
      this,
      isc.environmentName,
      "digitrafficpublicASubnet",
      this.vpc.publicSubnets[0].subnetId,
    );
    exportValue(
      this,
      isc.environmentName,
      "digitrafficpublicBSubnet",
      this.vpc.publicSubnets[1].subnetId,
    );
    exportValue(
      this,
      isc.environmentName,
      "digitrafficprivateASubnet",
      this.vpc.privateSubnets[0].subnetId,
    );
    exportValue(
      this,
      isc.environmentName,
      "digitrafficprivateBSubnet",
      this.vpc.privateSubnets[1].subnetId,
    );
  }

  createVpc(configuration: NetworkConfiguration): Vpc {
    const vpc = new Vpc(this, "DigitrafficVPC", {
      vpcName: configuration.vpcName,
      restrictDefaultSecurityGroup: false,
      availabilityZones: Stack.of(this).availabilityZones.sort().slice(0, 2), // take two first azs
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: configuration.transitGatewayId ? 0 : 2, // one for each AZ, or none if using transit gateway
      ipAddresses: IpAddresses.cidr(configuration.cidr),
      subnetConfiguration: [
        {
          name: "public",
          cidrMask: 24,
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: "private",
          cidrMask: 24,
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // route traffic to transit gateway
    if (configuration.transitGatewayId) {     
      vpc.selectSubnets(undefined).subnets.forEach((subnet) => {
      new CfnRoute(this, `SubnetRouteToTgw${subnet.node.id}`,
        {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: "0.0.0.0/0",
          transitGatewayId: configuration.transitGatewayId,
        });
      });
    }

    return vpc;
  }
}
