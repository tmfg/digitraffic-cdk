import axios from "axios";
import {EndpointProtocol, MonitoredEndpoint} from "../app-props";
import {MediaType} from "digitraffic-common/api/mediatypes";

const NODEPING_API = 'https://api.nodeping.com/api/1';

export enum NodePingCheckState {
    DOWN = 0,
    UP = 1
}

export type NodePingCheck = {
    readonly _id: string
    readonly label: string
    readonly type: string
    readonly state: NodePingCheckState
    readonly parameters: {
        readonly threshold: number
    }
}

export class NodePingApi {

    private readonly token: string;
    private readonly subAccountId: string;
    public readonly checkTimeoutSeconds?: number

    constructor(
        token: string,
        subAccountId: string,
        checkTimeoutSeconds?: number) {

        this.token = token;
        this.subAccountId = subAccountId;
        this.checkTimeoutSeconds = checkTimeoutSeconds;
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
        statuspageApiKey: string,
        statuspagePageId: string,
        statuspageComponentId: string) {
        console.log('Creating NodePing contact for endpoint', endpoint)
        const resp = await axios.post(`${NODEPING_API}/contacts`, {
            token: this.token,
            customerid: this.subAccountId,
            name: endpoint,
            newaddresses: [{
                address: `https://api.statuspage.io/v1/pages/${statuspagePageId}/components/${statuspageComponentId}.json`,
                type: 'webhook',
                action: 'patch',
                headers: {
                    Authorization: `OAuth ${statuspageApiKey}`
                },
                data: {'component[status]': '{if success}operational{else}major_outage{/if}'}
            }]
        });
        if (resp.status !== 200) {
            throw new Error('Unable to create contact');
        }
        console.log('..done');
    }

    async getNodepingChecks(): Promise<NodePingCheck[]> {
        console.log('Fetching NodePing checks')
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
        extraData?: MonitoredEndpoint) {

        console.log('Creating NodePing check for endpoint', endpoint);
        const notification: any = {};
        contactIds.forEach(contactId => {
            notification[`${contactId}`] = {'delay': 0, 'schedule': 'All'};
        });
        const data: any = {
            customerid: this.subAccountId,
            token: this.token,
            label: endpoint,
            type: extraData?.protocol === EndpointProtocol.WebSocket ? 'WEBSOCKET' : 'HTTPADV',
            target: extraData?.url ?? `https://${app}.digitraffic.fi${endpoint}`,
            interval: 5,
            threshold: this.checkTimeoutSeconds,
            enabled: true,
            follow: true,
            sendheaders: {'accept-encoding': 'gzip', 'digitraffic-user': 'Digitraffic Status'},
            method: extraData?.sendData == null ? 'GET' : 'POST',
            notifications: [notification]
        };
        if (extraData?.sendData) {
            data.postdata = extraData.sendData;
            data.sendheaders['content-type'] = MediaType.APPLICATION_JSON;
        }
        const resp = await axios.post(`${NODEPING_API}/checks`, data, {
            headers: {
                'Content-type': MediaType.APPLICATION_JSON
            }
        });
        if (resp.status !== 200 || resp.data.error) {
            console.error('method=createNodepingCheck Unable to create check', resp.data.error);
            throw new Error('Unable to create check');
        }
        console.log('..done');
    }

    async updateNodepingCheck(id: string, type: string) {
        const data: any = {
            customerid: this.subAccountId,
            token: this.token,
            id,
            type,
            threshold: this.checkTimeoutSeconds
        };
        console.info(`method=updateNodepingCheck Updating NodePing check id ${id}, properties ${data}`);
        const resp = await axios.put(`${NODEPING_API}/checks`, data, {
            headers: {
                'Content-type': MediaType.APPLICATION_JSON
            }
        });
        if (resp.status !== 200 || resp.data.error) {
            console.error('method=updateNodepingCheck Unable to update check', resp.data.error);
            throw new Error('Unable to update check');
        }
    }

    checkNeedsUpdate(check: NodePingCheck): boolean {
        let needsUpdate = false;
        if (this.checkTimeoutSeconds && this.checkTimeoutSeconds != check.parameters.threshold) {
            console.warn(`method=checkNeedsUpdate check id ${check._id}, label ${check.label} timeout ${check.parameters.threshold} lower than default ${this.checkTimeoutSeconds}`);
            needsUpdate = true;
        }
        return needsUpdate;
    }
}
