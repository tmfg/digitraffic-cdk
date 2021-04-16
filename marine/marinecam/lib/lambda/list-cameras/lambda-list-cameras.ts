import * as MetadataService from '../../service/metadata';

import {withDbSecret} from "../../../../../common/secrets/dbsecret";
import {KEY_SECRET_ID} from "../update-images/lambda-update-images";

const secretId = process.env[KEY_SECRET_ID] as string;

const GROUP_SEPARATOR=',';

export const handler = async (event: any) : Promise<any> => {
    const usersGroups = getUserGroups(event.groups);

    return await withDbSecret(secretId, async () => {
        return await MetadataService.listAllCameras(usersGroups);
    });
}

// eventGroups is in form [group1, group2...]
function getUserGroups(eventGroups: string): string[] {
    if(!eventGroups) return [];

    const withoutBraces = eventGroups.substring(1, eventGroups.length - 1);

    return withoutBraces.split(GROUP_SEPARATOR).map(s => s.trim());
}