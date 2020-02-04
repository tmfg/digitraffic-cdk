import {APIGatewayEvent} from 'aws-lambda';
import {findAllActiveAnnotations} from "../../service/annotations";

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    return await findAllActiveAnnotations();
};

