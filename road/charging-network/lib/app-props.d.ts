import { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export interface ChargingNetworkProps extends StackConfiguration {
    readonly ocpiDomainUrl: string; // ie. digitraffic.fi
    readonly ocpiPartyId: string; // ie. DTP
    readonly ocpiBusinessDetailsName: string;
    readonly ocpiBusinessDetailsWebsite: string;
}
