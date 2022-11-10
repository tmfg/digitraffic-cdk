import { DatabaseChecker } from "@digitraffic/common/aws/infra/canaries/database-checker";
import { DataType } from "@digitraffic/common/database/last-updated";
import { MaintenanceTrackingMunicipalityEnvKeys } from "../keys";

const domainName = process.env[
    MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME
] as string;

export const handler = () => {
    const checker = DatabaseChecker.createForProxy();

    checker.notEmpty(
        `Domain ${domainName} is not found`,
        `SELECT * FROM maintenance_tracking_domain WHERE name = '${domainName}'`
    );

    checker.notEmpty(
        `Domain ${domainName} doesn't have any contracts`,
        `SELECT * FROM maintenance_tracking_domain_contract WHERE domain = '${domainName}'`
    );

    checker.empty(
        `Domain ${domainName} has contracts without source information`,
        `SELECT * FROM maintenance_tracking_domain_contract WHERE source IS NULL AND domain = '${domainName}'`
    );

    checker.empty(
        `Domain ${domainName} have contracts those data is not updated in last 48 hours`,
        `SELECT * FROM maintenance_tracking_domain_contract WHERE data_last_updated < now() - interval '48 hours' AND domain = '${domainName}'`
    );

    checker.notEmpty(
        `Domain ${domainName} doesn't have fresh data from last 48h`,
        `SELECT * FROM maintenance_tracking WHERE maintenance_tracking.end_time > now() - interval '48 hours' AND domain = '${domainName}'`
    );

    checker.notEmpty(
        `Domain ${domainName} doesn't have task mappings`,
        `select * from maintenance_tracking_domain_task_mapping WHERE domain = '${domainName}'`
    );

    checker.empty(
        `Domain ${domainName} have unchecked task mappings`,
        `select * from maintenance_tracking_domain_task_mapping WHERE domain = '${domainName}' AND info like ('%TODO%')`
    );

    checker.notEmpty(
        "Data has not been checked in last hour",
        `SELECT * from data_updated where data_type = '${DataType.MAINTENANCE_TRACKING_DATA_CHECKED}' and updated > now() - interval '1 hours' and subtype = '${domainName}'`
    );

    return checker.expect();
};
