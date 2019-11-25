export const handler = async (event: any = {}) : Promise <any> => {
    console.log('Received request')
    if (!event.body) {
        console.log('Invalid')
        return { statusCode: 400, body: 'Invalid request' };
    }
    console.log('OK!')
    return { statusCode: 200, body: 'Ok!' };
};