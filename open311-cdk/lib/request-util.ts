export function invalidRequest(): object {
    return {statusCode: 400, body: 'Invalid request'};
}