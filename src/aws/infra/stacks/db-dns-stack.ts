import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import {
  PrivateHostedZone,
  RecordSet,
  RecordTarget,
  RecordType,
} from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import { importVpc } from "../import-util.js";
import { getParameterValue } from "../stack/parameters.js";
import type { InfraStackConfiguration } from "./intra-stack-configuration.js";

const DEFAULT_RECORD_TTL = Duration.seconds(30);

/**
 * Creates a dns local zone and creates records for cluster endpoints and proxy endpoints.
 *
 * Please note, that created PrivateHostedZone has RETAIN removalPolicy, so if you want to delete this stack,
 * you must remove the zone by hand after.
 */
export class DbDnsStack extends Stack {
  constructor(scope: Construct, id: string, isc: InfraStackConfiguration) {
    super(scope, id, {
      env: isc.env,
    });

    this.createDnsRecords(isc);
  }

  createDnsRecords(isc: InfraStackConfiguration): void {
    const vpc = importVpc(this, isc.environmentName);
    const zone = new PrivateHostedZone(this, "DNSHostedZone", {
      zoneName: `${isc.environmentName}.local`,
      vpc,
    });

    zone.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const clusterReaderEndpoint = getParameterValue(this, "cluster.reader");
    const clusterWriterEndpoint = getParameterValue(this, "cluster.writer");

    const proxyReaderEndpoint = getParameterValue(this, "proxy.reader");
    const proxyWriterEndpoint = getParameterValue(this, "proxy.writer");

    new RecordSet(this, "ReaderRecord", {
      recordType: RecordType.CNAME,
      recordName: `db-ro.${isc.environmentName}.local`,
      target: RecordTarget.fromValues(clusterReaderEndpoint),
      ttl: DEFAULT_RECORD_TTL,
      zone,
    });

    new RecordSet(this, "WriterRecord", {
      recordType: RecordType.CNAME,
      recordName: `db.${isc.environmentName}.local`,
      target: RecordTarget.fromValues(clusterWriterEndpoint),
      ttl: DEFAULT_RECORD_TTL,
      zone,
    });

    new RecordSet(this, "ProxyReaderRecord", {
      recordType: RecordType.CNAME,
      recordName: `proxy-ro.${isc.environmentName}.local`,
      target: RecordTarget.fromValues(proxyReaderEndpoint),
      ttl: DEFAULT_RECORD_TTL,
      zone,
    });

    new RecordSet(this, "ProxyWriterRecord", {
      recordType: RecordType.CNAME,
      recordName: `proxy.${isc.environmentName}.local`,
      target: RecordTarget.fromValues(proxyWriterEndpoint),
      ttl: DEFAULT_RECORD_TTL,
      zone,
    });
  }
}
