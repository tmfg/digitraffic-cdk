import axios, {AxiosResponse} from 'axios';

export async function getFaults(endpointUrl: string): Promise<any[]> {
    try {
        const resp = await getFaultsFromServer(endpointUrl);

        if (resp.status === 200) {
            return resp.data.features;
        }

        console.error('Fetching faults failed: %s', resp.statusText);

        return resp.data.features;
    } catch(err: any) {
        console.error("fetching failed with %d", err.status);
        console.error(err.message);
    }

    return [];
}

export async function getFaultsFromServer(url: string): Promise<AxiosResponse> {
    const start = Date.now();

    console.info("getFaultsFromServer: getting faults from " + url);

    return await axios.get(url, {
        timeout: 10000,
        headers: {
            'Accept': 'application/json'
        }
    }).then(a => {
        const end = Date.now();
        console.info("method=getFaultsFromServer faultCount=%d tookMs=%d", a.data.features.length, (end-start));
        return a;
    });
}
