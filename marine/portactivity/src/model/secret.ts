import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface UpdateAwakeAiETXTimestampsSecret extends GenericSecret {
    readonly voyagesurl: string;
    readonly voyagesauth: string;
}

export interface UpdateAwakeAiATXTimestampsSecret extends GenericSecret {
    readonly atxurl: string;
    readonly atxauth: string;
}
