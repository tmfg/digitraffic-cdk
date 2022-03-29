import {DatabaseChecker} from "digitraffic-common/aws/infra/canaries/database-checker";
import {DataType} from "digitraffic-common/database/last-updated";
import {MaintenanceTrackingMunicipalityEnvKeys} from "../keys";

const domainName = process.env[MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME] as string;

export const handler = () => {
    const checker = DatabaseChecker.create();

    checker.notEmpty(`domain ${domainName} is found`,
        `SELECT count(*) FROM maintenance_tracking_domain WHERE name = '${domainName}'`);

    checker.notEmpty(`domain ${domainName} has contracts`,
        `SELECT count(*) FROM maintenance_tracking_domain_contract WHERE domain = '${domainName}'`);

    checker.empty(`domain ${domainName} doesn't have contracts without source information`,
        `SELECT count(*) FROM maintenance_tracking_domain_contract WHERE source IS NULL AND domain = '${domainName}'`);

    checker.empty(`domain ${domainName} doesn't have contracts those data is not updated in last 48 hours`,
        `SELECT count(*) FROM maintenance_tracking_domain_contract WHERE data_last_updated < now() - interval '48 hours' AND domain = '${domainName}'`);

    // TODO commented until in production
    checker.notEmpty(`domain ${domainName} has fresh data from last 48h`,
        `select count(*) from (SELECT * FROM maintenance_tracking WHERE maintenance_tracking.end_time > now() - interval '48 hours' AND domain = '${domainName}' limit 1) sub`);

    checker.notEmpty(`domain ${domainName} has task mappings`,
        `select count(*) from maintenance_tracking_domain_task_mapping WHERE domain = '${domainName}'`);

    checker.notEmpty(`domain ${domainName} doesn't have unckecked task mappings`,
        `select count(*) from maintenance_tracking_domain_task_mapping WHERE domain = '${domainName}' AND info like ('%TODO%')`);

    checker.notEmpty('data updated in last hour',
        `SELECT count(*) from data_updated where data_type = '${DataType.MAINTENANCE_TRACKING_DATA}' and updated > now() - interval '1 hours'`);

    checker.notEmpty('data checked in last hour',
        `SELECT count(*) from data_updated where data_type = '${DataType.MAINTENANCE_TRACKING_DATA_CHECKED}' and updated > now() - interval '1 hours'`);

    return checker.expect();
};
