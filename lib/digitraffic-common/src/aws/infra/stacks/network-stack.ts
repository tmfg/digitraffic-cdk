import { IpAddresses, type IVpc, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import type { InfraStackConfiguration } from "./intra-stack-configuration.js";
import { exportValue } from "../import-util.js";
import { Stack } from "aws-cdk-lib/core";
import type { Construct } from "constructs/lib/construct.js";

export interface NetworkConfiguration {
    readonly vpcName: string;
    readonly cidr: string;
}

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
        return new Vpc(this, "DigitrafficVPC", {
            vpcName: configuration.vpcName,
            availabilityZones: Stack.of(this).availabilityZones.sort().slice(0, 2), // take two first azs
            enableDnsHostnames: true,
            enableDnsSupport: true,
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
    }
}
