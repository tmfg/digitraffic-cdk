import { dbTestBase, setTestEnv } from "../db-testutil";
setTestEnv();
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { Version, VersionString } from "../../lib/api/ocpi/ocpi-api-responses";
import * as OcpiRegistrationService from "../../lib/service/ocpi-registration-service";

describe(
    "ocpi-registration-service test",
    dbTestBase((db: DTDatabase) => {
        const VERSION_2_0: VersionString = "2.0" as const;
        const VERSION_2_1_1: VersionString = "2.1.1" as const;
        const VERSION_2_2_1: VersionString = "2.2.1" as const;
        const SUPPORTED_VERSIONS = [VERSION_2_0, VERSION_2_1_1, VERSION_2_2_1];

        // TODO
        // test("checkForNewCpoAndDoRegistration - empty", async () => {
        //     // http://localhost:8091/ocpi/cpo/versions
        //     await OcpiRegistrationService.doRegistration();
        // });

        test("resolveLatestCommonVersion - one match", () => {
            const cpoVersions: Version[] = [
                { version: "2.0.1", url: "foobar" },
                { version: "2.1.1", url: "foobar" }
            ];
            const result = OcpiRegistrationService.resolveLatestCommonVersion(
                SUPPORTED_VERSIONS,
                cpoVersions
            );
            expect(result?.version).toEqual(VERSION_2_1_1);
        });

        test("resolveLatestCommonVersion - multiple matches", () => {
            const cpoVersions: Version[] = [
                { version: "2.0", url: "foobar/2.0" },
                { version: "2.1.1", url: "foobar" },
                { version: "2.1.2", url: "foobar" }
            ];
            const result = OcpiRegistrationService.resolveLatestCommonVersion(
                SUPPORTED_VERSIONS,
                cpoVersions
            );
            expect(result?.version).toEqual(VERSION_2_1_1);
        });

        test("resolveLatestCommonVersion - no common version", () => {
            const cpoVersions: Version[] = [
                { version: "2.0.1", url: "foobar/1.0" },
                { version: "2.2.2", url: "foobar/2.2.2" }
            ];
            const result = OcpiRegistrationService.resolveLatestCommonVersion(
                SUPPORTED_VERSIONS,
                cpoVersions
            );
            expect(result).toBeUndefined();
        });

        test("resolveLatestCommonVersion - empty cpo versions", () => {
            const cpoVersions: Version[] = [];
            const result = OcpiRegistrationService.resolveLatestCommonVersion(
                SUPPORTED_VERSIONS,
                cpoVersions
            );
            expect(result).toBeUndefined();
        });

        test("resolveLatestCommonVersion - empty cpo versions2", () => {
            const result = OcpiRegistrationService.resolveLatestCommonVersion(SUPPORTED_VERSIONS, undefined);
            expect(result).toBeUndefined();
        });
    })
);
