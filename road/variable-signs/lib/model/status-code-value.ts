export class StatusCodeValue {
    readonly statusCode: number;

    static OK: StatusCodeValue = {
        statusCode: 200,
    };

    static INTERNAL_ERROR: StatusCodeValue = {
        statusCode: 500,
    };

    static BAD_REQUEST: StatusCodeValue = {
        statusCode: 400,
    };
}
