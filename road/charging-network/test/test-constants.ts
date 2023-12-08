import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { ChargingNetworkKeys } from "../lib/keys";
import * as OcpiRegistrationService from "../lib/service/ocpi-registration-service";

export const DT_CPO_ID = "DT_OCPI" as const;
export const CPO_TOKEN_A = OcpiRegistrationService.generateToken();
export const CPO_VERSIONS_ENPOINT = `${getEnvVariable(
    ChargingNetworkKeys.OCPI_DOMAIN_URL
)}/ocpi/cpo/versions` as const;
export const CPO_2_1_1_ENPOINT = `${getEnvVariable(
    ChargingNetworkKeys.OCPI_DOMAIN_URL
)}/ocpi/cpo/2.1.1/` as const;
export const CPO_2_1_1_CREDENTIALS_ENPOINT = `${CPO_2_1_1_ENPOINT}credentials/` as const;
export const CPO_2_1_1_LOCATIONS_ENPOINT = `${CPO_2_1_1_ENPOINT}locations/` as const;
export const CPO_WEBSITE = "https://test-cpo.com" as const;
export const CPO_NAME = "Test CPO" as const;
export const CPO_PARTY_ID = "TCO" as const;
export const CPO_COUNTRY_CODE = "FI" as const;
export const CPO_TOKEN_C = OcpiRegistrationService.generateToken();
