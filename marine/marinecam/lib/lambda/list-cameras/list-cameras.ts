import * as MetadataService from '../../service/metadata';

import {Camera} from "../../model/camera";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const secretHolder = SecretHolder.create();

const GROUP_SEPARATOR=',';

export const handler = (event: Record<string, string>) => {
    const usersGroups = getUserGroups(event.groups);

    if (usersGroups.length === 0) {
        return Promise.resolve([] as Camera[]);
    }

    return secretHolder.setDatabaseCredentials()
        .then(() => MetadataService.listAllCameras(usersGroups));
};

// eventGroups is in form [group1, group2...]
function getUserGroups(eventGroups: string): string[] {
    if (!eventGroups) {
        return [];
    }

    const withoutBraces = eventGroups.substring(1, eventGroups.length - 1);

    return withoutBraces.split(GROUP_SEPARATOR).map(s => s.trim());
}
