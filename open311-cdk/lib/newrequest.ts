import {APIGatewayEvent} from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) : Promise <any> => {
    if (!event.body) {
        console.log('Invalid request');
        return { statusCode: 400, body: 'Invalid request' };
    }
    console.log('Received request: ' + JSON.stringify(event.body));
    return { statusCode: 200, body: 'Ok!' };
};