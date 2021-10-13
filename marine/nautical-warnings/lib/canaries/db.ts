import {DatabaseChecker} from "digitraffic-common/canaries/database-checker";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {CACHE_KEY_ACTIVE, CACHE_KEY_ARCHIVED} from "../service/nautical-warnings";

const secretId = process.env[SECRET_ID] as string;

export const handler = async () => {
    const checker = new DatabaseChecker(secretId);
``
    checker.one('active cache is not empty',
        `select count(*) from cached_json where cache_id = '${CACHE_KEY_ACTIVE}'`);

    checker.one('archived cache is not empty',
        `select count(*) from cached_json where cache_id = '${CACHE_KEY_ARCHIVED}'`);

    checker.one('active cache updated in last 15 minutes',
        `select count(*) from cached_json where cache_id = '${CACHE_KEY_ARCHIVED}'
            and last_updated > now() - interval '15 minutes'`);

    checker.one('archived cache updated in last 15 minutes',
        `select count(*) from cached_json where cache_id = '${CACHE_KEY_ARCHIVED}'
            and last_updated > now() - interval '15 minutes'`);

    return checker.expect();
};
