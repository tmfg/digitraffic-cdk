import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { type Construct } from "constructs";

const SSM_ROOT = "/digitraffic" as const;
const MONITORING_ROOT = "/monitoring" as const;
const DB_ROOT = "/db" as const;

interface Parameter {
    readonly id?: string;
    readonly parameterName: string;
    readonly description?: string;
}

const PARAMETERS = {
    "topic.alarm": {
        parameterName: `${SSM_ROOT}${MONITORING_ROOT}/alarm-topic`,
    },
    "topic.warning": {
        parameterName: `${SSM_ROOT}${MONITORING_ROOT}/warning-topic`,
    },
    "cluster.reader": {
        id: "ClusterReaderEndpointParameter",
        parameterName: `${SSM_ROOT}${DB_ROOT}/reader-endpoint`,
        description: "Cluster reader endpoint",
    },
    "cluster.writer": {
        id: "ClusterWriterEndpointParameter",
        parameterName: `${SSM_ROOT}${DB_ROOT}/writer-endpoint`,
        description: "Cluster writer endpoint",
    },
    "cluster.identifier": {
        id: "ClusterIdentifierParameter",
        parameterName: `${SSM_ROOT}${DB_ROOT}/identifier`,
        description: "Cluster identifier",
    },
    "proxy.reader": {
        id: "ProxyReaderEndpointParameter",
        parameterName: `${SSM_ROOT}${DB_ROOT}/proxy-reader-endpoint`,
        description: "Proxy reader endpoint",
    },
    "proxy.writer": {
        id: "ProxyWriterEndpointParameter",
        parameterName: `${SSM_ROOT}${DB_ROOT}/proxy-writer-endpoint`,
        description: "Proxy writer endpoint",
    },
} as const satisfies Record<string, Parameter>;

export type ReadParameterType = keyof typeof PARAMETERS;
export type WriteParameterType = Exclude<
    Exclude<ReadParameterType, "topic.alarm">,
    "topic.warning"
>;

export function getParameterValue(
    scope: Construct,
    parameterType: ReadParameterType
) {
    const parameterName = PARAMETERS[parameterType].parameterName;
    return StringParameter.valueForStringParameter(scope, parameterName);
}

export function createParameter(
    scope: Construct,
    parameterType: WriteParameterType,
    stringValue: string
): StringParameter {
    const { id, parameterName, description } = PARAMETERS[parameterType];

    return new StringParameter(scope, id, {
        parameterName,
        description,
        stringValue,
    });
}
