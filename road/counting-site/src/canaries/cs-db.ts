import { DatabaseCountChecker } from "@digitraffic/common/dist/aws/infra/canaries/database-checker";
import { DataType } from "@digitraffic/common/dist/database/last-updated";

export const handler = (): Promise<string> => {
    const checker = DatabaseCountChecker.createForProxy();

    checker.expectOneOrMore("sites not empty", "select count(*) from cs2_site");
    
    checker.expectOneOrMore(
        "site data updated in last 48 hours",
        "select count(*) from cs2_site where last_data_timestamp > now() - interval '48 hours'"
    );
    
    checker.expectOneOrMore(
        "data updated in last 48 hours",
        "select count(*) from cs2_data where data_timestamp > now() - interval '48 hours'"
    );
    
    checker.expectOneOrMore(
        "data has values in last 48 hours",
        `with data as (
                select site_id, sum(counts) from cs2_data
                where data_timestamp > now() - interval '48 hours'
                group by site_id
            ) 
            select count(*) from data`
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
