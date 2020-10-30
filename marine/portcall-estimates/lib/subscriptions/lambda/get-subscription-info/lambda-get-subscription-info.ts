import * as InfoService from '../../service/info';

export async function handler() {
    const info = await InfoService.getInfo();
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(info)
    };
}
