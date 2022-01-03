import axios from "axios";
import {EndpointHttpMethod, EndpointProtocol, MonitoredEndpoint} from "../app-props";
import {MediaType} from "digitraffic-common/api/mediatypes";

const NODEPING_API = 'https://api.nodeping.com/api/1';

export const NODEPING_DIGITRAFFIC_USER = 'internal-digitraffic-status';

export enum NodePingCheckState {
    DOWN = 0,
    UP = 1
}

export enum NodePingCheckType {
    HTTPADV = 'HTTPADV',
    WEBSOCKET = 'WEBSOCKET'
}

export type NodePingCheck = {
    readonly _id: string
    readonly label: string
    readonly type: NodePingCheckType
    readonly state: NodePingCheckState
    readonly interval: number
    readonly parameters: {
        readonly target: string
        readonly method: EndpointHttpMethod
        readonly threshold: number
        readonly sendheaders: Record<string, string>
    }
}

export class NodePingApi {

    private readonly token: string;
    private readonly subAccountId: string;
    public readonly checkTimeoutSeconds?: number;
    public readonly checkInterval?: number;

    constructor(token: string,
        subAccountId: string,
        checkTimeoutSeconds?: number,
        checkInterval?: number) {

        this.token = token;
        this.subAccountId = subAccountId;
        this.checkTimeoutSeconds = checkTimeoutSeconds;
        this.checkInterval = checkInterval;
    }

    async getNodepingContacts () {
        console.log('Fetching NodePing contacts with token');
        const resp = await axios.get(`${NODEPING_API}/contacts?token=${this.token}&customerid=${this.subAccountId}`);
        if (resp.status !== 200) {
            throw new Error('Unable to fetch contacts');
        }
        console.log('..done');
        return resp.data;
    }

    async createNodepingContact(
        endpoint: string,
        app: string,
        statuspageApiKey: string,
        statuspagePageId: string,
        statuspageComponentId: string,
    ) {
        console.log('Creating NodePing contact for endpoint %s', endpoint);
        const resp = await axios.post(`${NODEPING_API}/contacts`, {
            token: this.token,
            customerid: this.subAccountId,
            name: `${app} ${endpoint}`,
            newaddresses: [{
                address: `https://api.statuspage.io/v1/pages/${statuspagePageId}/components/${statuspageComponentId}.json`,
                type: 'webhook',
                action: 'patch',
                headers: {
                    Authorization: `OAuth ${statuspageApiKey}`,
                },
                data: {'component[status]': '{if success}operational{else}major_outage{/if}'},
            }],
        });
        if (resp.status !== 200) {
            throw new Error('Unable to create contact');
        }
        console.log('..done');
    }

    async getNodepingChecks(): Promise<NodePingCheck[]> {
        console.log('Fetching NodePing checks');
        const resp = await axios.get(`${NODEPING_API}/checks?token=${this.token}&customerid=${this.subAccountId}`);
        if (resp.status !== 200) {
            throw new Error('Unable to fetch checks');
        }
        console.log('..done');
        return Object.values(resp.data) as NodePingCheck[];
    }

    async createNodepingCheck(
        endpoint: string,
        contactIds: string[],
        app: string,
        appName: string,
        extraData?: MonitoredEndpoint,
    ) {

        console.log('Creating NodePing check for endpoint', endpoint);
        const notification: any = {};
        contactIds.forEach(contactId => {
            notification[`${contactId}`] = {'delay': 0, 'schedule': 'All'};
        });
        const method = extraData?.method ?? EndpointHttpMethod.HEAD;
        const data: any = {
            customerid: this.subAccountId,
            token: this.token,
            label: endpoint.includes(appName) ? endpoint : `${appName} ${endpoint}`,
            type: extraData?.protocol === EndpointProtocol.WebSocket ? 'WEBSOCKET' : 'HTTPADV',
            target: extraData?.url ?? `https://${app}.digitraffic.fi${endpoint}`,
            interval: 5,
            threshold: this.checkTimeoutSeconds,
            enabled: true,
            follow: true,
            sendheaders: {'accept-encoding': 'gzip', 'digitraffic-user': 'Digitraffic Status'},
            method,
            notifications: [notification],
        };
        if (extraData?.sendData) {
            data.postdata = extraData.sendData;
            data.sendheaders['content-type'] = MediaType.APPLICATION_JSON;
        }
        const resp = await axios.post(`${NODEPING_API}/checks`, data, {
            headers: {
                'Content-type': MediaType.APPLICATION_JSON,
            },
        });
        if (resp.status !== 200 || resp.data.error) {
            console.error('method=createNodepingCheck Unable to create check', resp.data.error);
            throw new Error('Unable to create check');
        }
        console.log('..done');
    }

    async updateNodepingCheck(id: string, type: string, method: EndpointHttpMethod) {
        const data: any = {
            customerid: this.subAccountId,
            token: this.token,
            id,
            type,
            threshold: this.checkTimeoutSeconds,
            method,
            interval: this.checkInterval,
        };
        console.info(`method=updateNodepingCheck Updating NodePing check id ${id}, properties ${JSON.stringify(data)}`);
        const resp = await axios.put(`${NODEPING_API}/checks`, data, {
            headers: {
                'Content-type': MediaType.APPLICATION_JSON,
            },
        });
        if (resp.status !== 200 || resp.data.error) {
            console.error('method=updateNodepingCheck Unable to update check', resp.data.error);
            throw new Error('Unable to update check');
        }
    }

    checkNeedsUpdate(check: NodePingCheck, correspondingExtraEndpoint?: MonitoredEndpoint): boolean {
        let needsUpdate = false;

        if (this.checkTimeoutSeconds && this.checkTimeoutSeconds != check.parameters.threshold) {
            console.warn(`method=checkNeedsUpdate check id ${check._id}, label ${check.label} timeout ${check.parameters.threshold} different than default ${this.checkTimeoutSeconds}`);
            needsUpdate = true;
        }

        if (this.checkInterval && this.checkInterval != check.interval) {
            console.warn(`method=checkNeedsUpdate check id ${check._id}, label ${check.label} interval ${check.interval} different than default ${this.checkInterval}`);
            needsUpdate = true;
        }

        if (check.type === NodePingCheckType.HTTPADV) {
            const method = correspondingExtraEndpoint?.method ?? EndpointHttpMethod.HEAD;
            if (check.parameters.method !== method) {
                console.warn(`method=checkNeedsUpdate check id ${check._id}, label ${check.label} method was not ${EndpointHttpMethod.HEAD}, instead: ${check.parameters.method}`);
                needsUpdate = true;
            }
        }

        // eslint-disable-next-line no-prototype-builtins
        const digitrafficUser = check.parameters.sendheaders['digitraffic-user'];
        if (digitrafficUser !== NODEPING_DIGITRAFFIC_USER) {
            console.warn(`method=checkNeedsUpdate check id ${check._id}, label ${check.label} doesn't have digitraffic user headerr`);
            needsUpdate = true;
        }

        return needsUpdate;
    }
}
