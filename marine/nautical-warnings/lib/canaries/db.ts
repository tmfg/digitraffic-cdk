import {DatabaseChecker} from "digitraffic-common/canaries/database-checker";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {JSON_CACHE_KEY} from "digitraffic-common/db/cached";

const secretId = process.env[SECRET_ID] as string;

export const handler = async () => {
    const checker = new DatabaseChecker(secretId);

    checker.one('active cache is not empty',
        `select count(*) from cached_json where cache_id = '${JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE}'`);

    checker.one('archived cache is not empty',
        `select count(*) from cached_json where cache_id = '${JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED}'`);

    checker.one('active cache updated in last 15 minutes',
        `select count(*) from cached_json where cache_id = '${JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE}'
            and last_updated > now() - interval '15 minutes'`);

    checker.one('archived cache updated in last 15 minutes',
        `select count(*) from cached_json where cache_id = '${JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED}'
            and last_updated > now() - interval '15 minutes'`);

    return checker.expect();
};
