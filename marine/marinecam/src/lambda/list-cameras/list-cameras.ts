import { RdsHolder } from "@digitraffic/common/dist/aws/runtime/secrets/rds-holder";

import type { Camera } from "../../model/camera.js";
import * as MetadataService from "../../service/metadata.js";

const rdsHolder = RdsHolder.create();

const GROUP_SEPARATOR = ",";

interface ListCamerasEvent {
  groups: string;
}

export function handler(event: ListCamerasEvent): Promise<Camera[]> {
  const usersGroups = getUserGroups(event.groups);

  if (usersGroups.length === 0) {
    return Promise.resolve([] as Camera[]);
  }

  return rdsHolder
    .setCredentials()
    .then(() => MetadataService.listAllCameras(usersGroups));
}

// eventGroups is in form [group1, group2...]
function getUserGroups(eventGroups: string): string[] {
  if (!eventGroups) {
    return [];
  }

  const withoutBraces = eventGroups.substring(1, eventGroups.length - 1);

  return withoutBraces.split(GROUP_SEPARATOR).map((s) => s.trim());
}
