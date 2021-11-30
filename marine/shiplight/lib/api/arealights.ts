import axios from 'axios'

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

    private readonly url: string
    private readonly apiKey: string

    constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    async updateLightsForArea(request: AreaLightsBrightenRequest): Promise<AreaLightsBrightenResponse> {
        const start = Date.now();
        try {
            const resp = await axios.post(this.url, request, {
                headers: {
                    'x-api-key': this.apiKey
                }
            });
            if (resp.status !== 200) {
                console.error(`method=updateLightsForArea returned status=${resp.status}`);
                return Promise.reject(`API returned status ${resp.status}`);
            }
            console.info('method=updateLightsForArea successful');
            return Promise.resolve(resp.data);
        } catch (error) {
            console.error('method=updateLightsForArea failed');
            throw new Error('Update lights for area failed');
        } finally {
            console.log(`method=updateLightsForArea tookMs=${Date.now() - start}`)
        }
    }
}
