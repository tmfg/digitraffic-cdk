import { DatabaseCountChecker } from "@digitraffic/common/dist/aws/infra/canaries/database-checker";

export const handler = () => {
    const checker = DatabaseCountChecker.createForRds();

    checker.expectOneOrMore("cameras not empty", "select count(*) from camera");

    checker.expectOneOrMore(
        "cameras updated in last hour",
        "select count(*) from camera where last_updated > now() - interval '1 hour'"
    );

    return checker.expect();
};
