import axios from "axios";
import {EndpointProtocol, MonitoredEndpoint} from "../app-props";
import {MediaType} from "digitraffic-common/api/mediatypes";

const NODEPING_API = 'https://api.nodeping.com/api/1';

export enum NodePingCheckState {
    DOWN = 0,
    UP = 1
}

export type NodePingCheck = {
    readonly label: string
    readonly state: NodePingCheckState
}

export class NodePingApi {

    private readonly token: string;
    private readonly subAccountId: string;

    constructor(token: string, subAccountId: string) {
        this.token = token;
        this.subAccountId = subAccountId;
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
            threshold: 30,
            enabled: true,
            follow: true,
            sendheaders: {'accept-encoding': 'gzip'},
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
}
