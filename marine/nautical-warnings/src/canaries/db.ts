import { DatabaseCountChecker } from "@digitraffic/common/dist/aws/infra/canaries/database-checker";
import { JSON_CACHE_KEY } from "@digitraffic/common/dist/database/cached";

export const handler: () => Promise<string> = () => {
    const checker = DatabaseCountChecker.createForProxy();

    checker.expectOne(
        "active cache is not empty",
        `select count(*) from cached_json where cache_id = '${JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE}'`
    );

    checker.expectOne(
        "archived cache is not empty",
        `select count(*) from cached_json where cache_id = '${JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED}'`
    );

    checker.expectOne(
        "active cache updated in last 3 days",
        `select count(*) from cached_json where cache_id = '${JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE}'
            and modified > now() - interval '3 days'`
    );

    /*checker.expectOne(
        "archived cache updated in last 3 days",
        `select count(*) from cached_json where cache_id = '${JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED}'
            and last_updated > now() - interval '3 days'`
    );*/

    return checker.expect();
};
