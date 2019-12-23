import {APIGatewayEvent} from 'aws-lambda';
import {findAllActiveAnnotations} from "../../service/annotations";

export const handler = async (event: APIGatewayEvent): Promise<any> => {
    const annotations = await findAllActiveAnnotations();

    return {statusCode: 200, body: JSON.stringify(annotations)};
};

