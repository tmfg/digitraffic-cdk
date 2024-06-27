import { DatabaseCountChecker } from "@digitraffic/common/dist/aws/infra/canaries/database-checker";
import { DataType } from "@digitraffic/common/dist/database/last-updated";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { MaintenanceTrackingMunicipalityEnvKeys } from "../keys";

const domainName = getEnvVariable(MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME);

export const handler = (): Promise<string> => {
    const checker = DatabaseCountChecker.createForProxy();

    checker.expectOneOrMore(
        `Domain ${domainName} exists`,
        `SELECT count(*) FROM maintenance_tracking_domain WHERE name = '${domainName}'`
    );

    checker.expectOneOrMore(
        `Domain ${domainName} has any contracts`,
        `SELECT count(*) FROM maintenance_tracking_domain_contract WHERE domain = '${domainName}'`
    );

    checker.expectZero(
        `Domain ${domainName} has only contracts with source information`,
        `SELECT count(*) FROM maintenance_tracking_domain_contract WHERE source IS NULL AND domain = '${domainName}'`
    );

    checker.expectZero(
        `Domain ${domainName} contracts route data is updated in last 48 hours`,
        `SELECT count(*) FROM maintenance_tracking_domain_contract WHERE data_last_updated < now() - interval '48 hours' AND domain = '${domainName}'`
    );

    checker.expectOneOrMore(
        `Domain ${domainName} has fresh data from last 48h`,
        `SELECT count(*) FROM maintenance_tracking WHERE maintenance_tracking.end_time > now() - interval '48 hours' AND domain = '${domainName}'`
    );

    checker.expectOneOrMore(
        `Domain ${domainName} has task mappings`,
        `select count(*) from maintenance_tracking_domain_task_mapping WHERE domain = '${domainName}'`
    );

    checker.expectZero(
        `Domain ${domainName} doesn't have unchecked task mappings`,
        `select count(*) from maintenance_tracking_domain_task_mapping WHERE domain = '${domainName}' AND info like ('%TODO%')`
    );

    checker.expectOneOrMore(
        "Data has been checked in last hour",
        `SELECT count(*) from data_updated where data_type = '${DataType.MAINTENANCE_TRACKING_DATA_CHECKED}' and updated > now() - interval '1 hours' and subtype = '${domainName}'`
    );

    return checker.expect();
};
