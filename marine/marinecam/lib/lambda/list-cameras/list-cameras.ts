import * as MetadataService from '../../service/metadata';

import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {Camera} from "../../model/camera";

const secretId = process.env[SECRET_ID] as string;

const GROUP_SEPARATOR=',';

export const handler = (event: Record<string, string>) => {
    const usersGroups = getUserGroups(event.groups);

    if(usersGroups.length === 0) {
        return Promise.resolve([] as Camera[]);
    }

    return withDbSecret(secretId, () => {
        return MetadataService.listAllCameras(usersGroups);
    });
}

// eventGroups is in form [group1, group2...]
function getUserGroups(eventGroups: string): string[] {
    if(!eventGroups) {
        return [];
    }

    const withoutBraces = eventGroups.substring(1, eventGroups.length - 1);

    return withoutBraces.split(GROUP_SEPARATOR).map(s => s.trim());
}
