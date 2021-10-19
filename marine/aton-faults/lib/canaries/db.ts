import {DatabaseChecker} from "digitraffic-common/canaries/database-checker";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";

const secretId = process.env[SECRET_ID] as string;

export const handler = async () => {
    const checker = new DatabaseChecker(secretId);

    checker.notEmpty('states are not empty',
        'select couhnt(*) from aton_fault_state');

    checker.notEmpty('fault types are not empty',
        'select count(*) from aton_fault_type');

    checker.notEmpty('types are not empty',
        'select count(*) from aton_type');

    checker.notEmpty('aton_fault timestamps updated in last 24 hours',
        'select count(*) from aton_fault where entry_timestamp > now() - interval \'24 hours\'');

    return checker.expect();
};
