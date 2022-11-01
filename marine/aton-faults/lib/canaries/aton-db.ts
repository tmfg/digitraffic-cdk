import { DatabaseChecker } from "@digitraffic/common/dist/aws/infra/canaries/database-checker";

export const handler = () => {
    const checker = DatabaseChecker.createForRds();

    checker.notEmpty(
        "states are not empty",
        "select count(*) from aton_fault_state"
    );

    checker.notEmpty(
        "fault types are not empty",
        "select count(*) from aton_fault_type"
    );

    checker.notEmpty("types are not empty", "select count(*) from aton_type");

    checker.notEmpty(
        "aton_fault timestamps updated in last 24 hours",
        "select count(*) from aton_fault where entry_timestamp > now() - interval '24 hours'"
    );

    return checker.expect();
};
