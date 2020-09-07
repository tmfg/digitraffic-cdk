import {findActiveAnnotations} from "../../service/annotations";

export const handler = async (event: any): Promise<any> => {
    const author = event['author'] as string | null;
    const type = event['type'] as string | null;

    return await findActiveAnnotations(author, type);
};

