import axios from 'axios';

export type AreaLightsBrightenRequest = {

    /**
     * Route id
     */
    readonly routeId: number

    /**
     * Visibility in metres
     */
    readonly visibility: number | null

    /**
     * Time to set the brightness on in minutes
     */
    readonly time: number
}

export type AreaLightsBrightenResponse = {
    /**
     * ATON numbers for successful lights set commands
     */
    readonly LightsSetSentSuccessfully: number[]

    /**
     * ATON numbers for failed lights set commands
     */
    readonly LightsSetSentFailed: number[]
}

export class AreaLightsApi {

    private readonly url: string;
    private readonly apiKey: string;

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    updateLightsForArea(request: AreaLightsBrightenRequest): Promise<AreaLightsBrightenResponse> {
        const start = Date.now();

        const requestPromise = axios.post(this.url, request, {
            headers: { 'x-api-key': this.apiKey },
            validateStatus: (status) => status === 200,
        });

        return requestPromise
            .then((response) => {
                console.info('method=updateLightsForArea successful');
                return response.data;
            })
            .catch((error) => {
                console.error(`method=updateLightsForArea returned status=${error.status}`);
                return Promise.reject(`API returned status ${error.status}`);
            })
            .finally(() => console.log(`method=updateLightsForArea tookMs=${Date.now() - start}`));
    }
}