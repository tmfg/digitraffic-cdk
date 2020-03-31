export function invalidRequest(): object {
    return {statusCode: 400, body: 'Invalid request'};
}

export function serverError() {
    return {statusCode: 500, body: 'Server error'};
}
