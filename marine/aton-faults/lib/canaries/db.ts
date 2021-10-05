import {DatabaseChecker} from "digitraffic-common/canaries/database-checker";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";

const secretId = process.env[SECRET_ID] as string;

export const handler = async () => {
    const checker = new DatabaseChecker(secretId);

    await checker.expect([{
        name: 'states are not empty',
        sql: 'select count(*) from aton_fault_state'
    }, {
        name: 'fault types are not empty',
        sql: 'select count(*) from aton_fault_type'
    }, {
        name: 'types are not empty',
        sql: 'select count(*) from aton_type'
    }, {
        name: 'aton_fault timestamps updated in last 24 hours',
        sql: 'select count(*) from aton_fault where entry_timestamp > now() - interval \'24 hours\''
    }]);

    return checker.done();
};
