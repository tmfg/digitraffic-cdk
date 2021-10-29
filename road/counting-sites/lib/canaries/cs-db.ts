import {DatabaseChecker} from "digitraffic-common/canaries/database-checker";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";

const secretId = process.env[SECRET_ID] as string;

export const handler = async () => {
    const checker = new DatabaseChecker(secretId);

    checker.notEmpty('domains not empty',
        'select count(*) from counting_site_domain');

    checker.notEmpty('counters data updated in last 48 hours',
        'select count(*) from counting_site_counter where last_data_timestamp > now() - interval \'48 hours\'');

    checker.notEmpty('data updated in last 48 hours',
        'select count(*) from counting_site_data where data_timestamp > now() - interval \'48 hours\'');

    checker.notEmpty('data has values in last 48 hours',
        `with data as (
                select counter_id, sum(count) from counting_site_data csd  where data_timestamp > now() - interval '48 hours'
                group by counter_id
            ) 
            select count(*) from data
            where sum > 0`);

    return checker.expect();
};