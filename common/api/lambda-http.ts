import {createHash} from 'crypto';

type HttpMethod =
    'HEAD' |
    'GET';

export interface LambdaHttpEvent {
    readonly method: HttpMethod
}

function hash(response: any) {
    return 'W/' + '"'  + createHash('md5').update(JSON.stringify(response)).digest('hex') + '"';
}

export function responseByMethod(fn: () => Promise<any>) {
    return async (event: LambdaHttpEvent) => {
        const response = await fn();
        return event.method == 'HEAD' ? hash(response) : response;
    };
}
