import { doDelete } from "../../service/requests.js";

export const handler = async (event: DeleteRequestEvent): Promise<void> => {
    await doDelete(event.request_id);
};

interface DeleteRequestEvent {
    readonly request_id: string;
}
