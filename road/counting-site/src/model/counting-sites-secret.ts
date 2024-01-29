import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";

export interface CountingSitesSecret extends GenericSecret {
    apiKey: string;
    url: string;
}
