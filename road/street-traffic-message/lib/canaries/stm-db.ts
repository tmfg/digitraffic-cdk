import {DatabaseChecker} from "@digitraffic/common/aws/infra/canaries/database-checker";
import {DataType} from "@digitraffic/common/database/last-updated";

export const handler = (): Promise<string> => {
    const checker = DatabaseChecker.createForProxy();

    checker.notEmpty("permit table not empty",
        "SELECT COUNT(*) FROM permit");

    checker.notEmpty("permit data updated in last 2 hours",
        `SELECT COUNT(*)
         FROM data_updated
         WHERE data_type = '${DataType.PERMIT_DATA_CHECK}'
           AND updated > NOW() - interval '2 hours'`);

    checker.empty("permit table does not contain expired but unremoved permits",
        `SELECT COUNT(*)
         FROM permit
         WHERE removed = false
           AND effective_to < NOW()`);

    return checker.expect();
};
