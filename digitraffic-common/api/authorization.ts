import {AUTHORIZATION_FAILED_MESSAGE} from "./errors";

export async function authorizeUserGroup(event: any, callback: any, required: string, funcCall: any): Promise<any> {
    if (checkAuthorization(event.groups, required)) {
        return funcCall();
    }

    throw new Error(AUTHORIZATION_FAILED_MESSAGE);
}

function checkAuthorization(groupString: string, required: string): boolean {
    if(groupString.length === 0) {
        return true;
    }

    const groups = groupString.split(',');
    console.info("checking %s for %s", groups, required);

    return groups.filter(g => g === required).length > 0;
}
