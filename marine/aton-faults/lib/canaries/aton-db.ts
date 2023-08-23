import { DatabaseCountChecker } from "@digitraffic/common/dist/aws/infra/canaries/database-checker";

export const handler = (): Promise<string> => {
    const checker = DatabaseCountChecker.createForRds();

    checker.expectOneOrMore("states are not empty", "select count(*) from aton_fault_state");

    checker.expectOneOrMore("fault types are not empty", "select count(*) from aton_fault_type");

    checker.expectOneOrMore("types are not empty", "select count(*) from aton_type");

    checker.expectOneOrMore(
        "aton_fault some entry updated in last 100 hours",
        "select count(*) from aton_fault where entry_timestamp > now() - interval '100 hours'"
    );

    return checker.expect();
};
