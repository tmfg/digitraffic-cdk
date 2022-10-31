import { DatabaseChecker } from "@digitraffic/common/dist/aws/infra/canaries/database-checker";

export const handler = () => {
    const checker = DatabaseChecker.createForRds();

    checker.notEmpty("cameras not empty", "select count(*) from camera");

    checker.notEmpty(
        "cameras updated in last hour",
        "select count(*) from camera where last_updated > now() - interval '1 hour'"
    );

    return checker.expect();
};
