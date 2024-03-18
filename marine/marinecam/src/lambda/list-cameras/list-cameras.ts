import * as MetadataService from "../../service/metadata.js";

import type { Camera } from "../../model/camera.js";
import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";

const rdsHolder = RdsHolder.create();

const GROUP_SEPARATOR = ",";

export const handler: (event: Record<string, string>) => Promise<Camera[]> = (
    event: Record<string, string>
) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, dot-notation
    const usersGroups = getUserGroups(event["groups"]!);

    if (usersGroups.length === 0) {
        return Promise.resolve([] as Camera[]);
    }

    return rdsHolder.setCredentials().then(() => MetadataService.listAllCameras(usersGroups));
};

// eventGroups is in form [group1, group2...]
function getUserGroups(eventGroups: string): string[] {
    if (!eventGroups) {
        return [];
    }

    const withoutBraces = eventGroups.substring(1, eventGroups.length - 1);

    return withoutBraces.split(GROUP_SEPARATOR).map((s) => s.trim());
}
