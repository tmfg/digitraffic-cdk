import { DatabaseCountChecker } from "@digitraffic/common/dist/aws/infra/canaries/database-checker";
import { DataType } from "@digitraffic/common/dist/database/last-updated";

export const handler = () => {
    const checker = DatabaseCountChecker.createForProxy();

    checker.expectOneOrMore(
        "domains not empty",
        "select count(*) from counting_site_domain"
    );

    checker.expectOneOrMore(
        "counters data updated in last 48 hours",
        "select count(*) from counting_site_counter where last_data_timestamp > now() - interval '48 hours'"
    );

    checker.expectOneOrMore(
        "data updated in last 48 hours",
        "select count(*) from counting_site_data where data_timestamp > now() - interval '48 hours'"
    );

    checker.expectOneOrMore(
        "data has values in last 48 hours",
        `with data as (
                select counter_id, sum(count) from counting_site_data csd  where data_timestamp > now() - interval '48 hours'
                group by counter_id
            ) 
            select count(*) from data
            where sum > 0`
    );

    checker.expectOneOrMore(
        "metadata updated in last 2 hours",
        `select count(*) from data_updated where data_type = '${DataType.COUNTING_SITES_METADATA_CHECK}' and updated > now() - interval '2 hours'`
    );

    checker.expectOneOrMore(
        "data updated in last 2 hours",
        `select count(*) from data_updated where data_type = '${DataType.COUNTING_SITES_DATA}' and updated > now() - interval '2 hours'`
    );

    return checker.expect();
};
