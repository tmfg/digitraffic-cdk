import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
export interface UpdateStatusSecret extends GenericSecret {
    readonly nodePingToken: string;
    readonly nodePingSubAccountId: string;
    readonly statuspagePageId: string;
    readonly statuspageApiKey: string;
    readonly statusPageRoadComponentGroupId: string;
    readonly statusPageMarineComponentGroupId: string;
    readonly statusPageRailComponentGroupId: string;
    readonly nodePingContactIdSlack1: string;
    readonly nodePingContactIdSlack2: string;
    readonly reportUrl: string;
    readonly gitHubPat: string;
}
