import {APIGatewayEvent} from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) : Promise <any> => {
    console.log('Received request for id ' + event.pathParameters?.['request_id']);
    return { statusCode: 200, request: JSON.stringify(null) };
};
