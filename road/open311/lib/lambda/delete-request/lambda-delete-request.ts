import {doDelete} from "../../service/requests";

export const handler = async (event: DeleteRequestEvent): Promise <void> => {
    await doDelete(event.request_id);
};

interface DeleteRequestEvent {
    // eslint-disable-next-line camelcase
    readonly request_id: string;
}
