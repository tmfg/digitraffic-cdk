import axios from 'axios';
import {Devices, devicesParser} from "../model/devices";
import {Alarms, alarmsParser} from "../model/alarms";
import {alarmTypesParser, AlarmTypes} from "../model/alarm-types";

export class RoadConditionApi {
    readonly authKey: string;
    readonly endpointUrl: string;

    constructor(authKey: string, endpointUrl: string) {
        this.authKey = authKey;
        this.endpointUrl = endpointUrl;
    }

    private getFromServer<T>(method: string, url: string): Promise<T> {
        const start = Date.now();
        const serverUrl = `${this.endpointUrl}${url}?authKey=${this.authKey}`;

        console.info("sending request to " + serverUrl);

        return axios
            .get(serverUrl)
            .then(response => {
                console.log(`got response: ${JSON.stringify(response)}`);
                return response;
            })
            .then(response => response.status === 200 ? response.data : Promise.reject(response.data))
            .catch(e => {
                console.error(`error from ${serverUrl}`);
                console.error(`method=${method} failed`);
                return Promise.reject(e);
            })
            .finally(() => console.info(`method=${method} url=${serverUrl} tookMs=${Date.now() - start}`));
    }

    getDevices(): Promise<Devices> {
        return this.getFromServer("GET", "/keli/laitetiedot")
            .then(devicesParser);
    }

    getAlarms(): Promise<Alarms> {
        return this.getFromServer("GET", "/keli/halytykset")
            .then(alarmsParser);
    }

    getAlarmTypes(): Promise<AlarmTypes> {
        return this.getFromServer("GET", "/keli/halytystyypit")
            .then(alarmTypesParser);
    }
}
