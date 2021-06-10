import * as MetadataService from '../../service/metadata';

import {withDbSecret} from "../../../../../common/secrets/dbsecret";
import {MarinecamEnvKeys} from "../../keys";

const secretId = process.env[MarinecamEnvKeys.SECRET_ID] as string;

const GROUP_SEPARATOR=',';

export const handler = async (event: any) : Promise<any> => {
    const usersGroups = getUserGroups(event.groups);

    if(usersGroups.length === 0) {
        return {};
    }

    return withDbSecret(secretId, async () => {
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
