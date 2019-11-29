import {APIGatewayEvent} from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) : Promise <any> => {
    console.log('Received request for service id ' + event.pathParameters?.['service_id']);
    return { statusCode: 200, service: JSON.stringify(null) };
};
