import axios from 'axios';

const NODEPING_API = 'https://api.nodeping.com/api/1';
const STATUSPAGE_API = 'https://api.statuspage.io/v1/pages';

async function getDigitrafficEndpoints(app: string) {
    console.log("Fetching digitraffic endpoints")
    const r = await axios.get(`https://${app}.digitraffic.fi/swagger/swagger-spec.json`, {
        headers: {
            'accept-encoding': 'gzip'
        }
    });
    if (r.status != 200) {
        throw new Error('Unable to fetch contacts');
    }
    console.log("..done");
    const all = Object.keys(r.data.paths).filter(p => !p.includes('{'));
    const notBeta = all.filter((e) => !e.includes('beta'));
    const beta = all.filter((e) => e.includes('beta'));
    notBeta.sort();
    beta.sort();
    return ([] as string[]).concat(notBeta).concat(beta);
}

async function getStatuspageComponents(statuspagePageId: string, statuspageApiKey: string) {
    console.log("Fetching Statuspage components");
    const r = await axios.get(`${STATUSPAGE_API}/${statuspagePageId}/components`, {
        headers: {
            Authorization: `OAuth ${statuspageApiKey}`
        }
    });
    if (r.status != 200) {
        throw new Error('Unable to get Statuspage components');
    }
    console.log("..done");
    return r.data;
}

async function createStatuspageComponent(
    endpoint: string,
    statuspagePageId: string,
    statuspageComponentGroupId: string,
    statuspageApiKey: string) {
    console.log("Creating Statuspage component for endpoint", endpoint)
    const r = await axios.post(`${STATUSPAGE_API}/${statuspagePageId}/components`, {
        component: {
            description: endpoint,
            status: 'operational',
            name: endpoint,
            only_show_if_degraded: 'false',
            group_id: statuspageComponentGroupId,
            showcase: 'true'
        }
    }, {
        headers: {
            Authorization: `OAuth ${statuspageApiKey}`,
            'Content-type': 'application/json'
        }
    });
    if (r.status != 201) {
        throw new Error('Unable to create Statuspage component');
    }
    console.log("..done")
    return r.data;
}

async function getNodepingContacts(nodepingToken: string, subaccountId: string) {
    console.log("Fetching NodePing contacts with token");
    const r = await axios.get(`${NODEPING_API}/contacts?token=${nodepingToken}&customerid=${subaccountId}`);
    if (r.status != 200) {
        throw new Error('Unable to fetch contacts');
    }
    console.log("..done");
    return r.data;
}

async function createNodepingContact(
    endpoint: string,
    nodepingSubaccountId: string,
    statuspageApiKey: string,
    nodepingToken: string,
    statuspagePageId: string,
    statuspageComponentId: string) {
    console.log("Creating NodePing contact for endpoint", endpoint)
    const r = await axios.post(`${NODEPING_API}/contacts`, {
        token: nodepingToken,
        customerid: nodepingSubaccountId,
        name: endpoint,
        newaddresses: [{
            address: `https://api.statuspage.io/v1/pages/${statuspagePageId}/components/${statuspageComponentId}.json`,
            type: 'webhook',
            action: 'patch',
            headers: {
                Authorization: `OAuth ${statuspageApiKey}`
            },
            data: {"component[status]": "{if success}operational{else}major_outage{/if}"}
        }]
    });
    if (r.status != 200) {
        throw new Error('Unable to create contact');
    }
    console.log("..done");
}

async function getNodepingChecks(nodepingToken: string, subaccountId: string) {
    console.log("Fetching NodePing checks")
    const r = await axios.get(`${NODEPING_API}/checks?token=${nodepingToken}&customerid=${subaccountId}`);
    if (r.status != 200) {
        throw new Error('Unable to fetch checks');
    }
    console.log("..done");
    return Object.values(r.data).map((check: any) => check.parameters.target);
}

async function createNodepingCheck(
    endpoint: string,
    nodepingToken: string,
    subaccountId: string,
    contactId: string,
    app: string) {
    console.log("Creating NodePing check for endpoint", endpoint);
    const notification: any = {};
    notification[`${contactId}`] = {'delay': 0, 'schedule': 'All'};
    const data = {
        customerid: subaccountId,
        token: nodepingToken,
        label: endpoint,
        type: 'HTTPADV',
        target: `https://${app}.digitraffic.fi${endpoint}`,
        interval: 1,
        enabled: true,
        follow: true,
        sendheaders: {'accept-encoding': 'gzip'},
        notifications: [notification]
    };
    const r = await axios.post(`${NODEPING_API}/checks`, data, {
        headers: {
            'Content-type': 'application/json'
        }
    });
    if (r.status != 200) {
        throw new Error('Unable to create check');
    }
    console.log("..done");
}

export const handler = async (): Promise<any> => {
    const endpoints: string[] = await getDigitrafficEndpoints(process.env.APP as string);
    console.log(endpoints);

    let statuspageComponents: any[] = await getStatuspageComponents(process.env.STATUSPAGE_PAGE_ID as string,
        process.env.STATUSPAGE_API_KEY as string);
    const statuspageComponentNames: string[] = statuspageComponents.map(c => c.name);
    const missingComponents = endpoints.filter(e => !statuspageComponentNames.includes(e));
    console.log('Missing components', missingComponents);
    await Promise.all(missingComponents.map(c => createStatuspageComponent(c,
        process.env.STATUSPAGE_PAGE_ID as string,
        process.env.STATUSPAGE_COMPONENT_GROUP_ID as string,
        process.env.STATUSPAGE_API_KEY as string)));
    if (missingComponents.length > 0) {
        statuspageComponents = await getStatuspageComponents(process.env.STATUSPAGE_PAGE_ID as string,
            process.env.STATUSPAGE_API_KEY as string);
    }

    let contacts = await getNodepingContacts(process.env.NODEPING_TOKEN as string,
        process.env.NODEPING_SUBACCOUNT_ID as string);
    const contactNames: string[] = Object.values(contacts).map((c: any) => c.name);
    const missingContacts = endpoints.filter(e => !contactNames.includes(e));
    console.log('Missing contacts', missingContacts);
    await Promise.all(missingContacts.map(e => {
        const component = statuspageComponents.find(c => c.name === e);
        if (!component) {
            throw new Error(`Component for ${e} not found`);
        }
        return createNodepingContact(e, process.env.NODEPING_SUBACCOUNT_ID as string,
            process.env.STATUSPAGE_API_KEY as string,
            process.env.NODEPING_TOKEN as string,
            process.env.STATUSPAGE_PAGE_ID as string,
            component['id'] as string)
    }));
    if (missingContacts.length > 0) {
        contacts = await getNodepingContacts(process.env.NODEPING_TOKEN as string,
            process.env.NODEPING_SUBACCOUNT_ID as string);
    }

    const checks: string[] = await getNodepingChecks(process.env.NODEPING_TOKEN as string,
        process.env.NODEPING_SUBACCOUNT_ID as string);
    const missingChecks = endpoints.filter(e => !checks.includes(e));
    console.log('Missing checks', missingChecks);
    await Promise.all(missingChecks.map(e => {
        const contact: any = Object.values(contacts).find((c: any) => c.name === e);
        if (!contact) {
            throw new Error(`Contact for ${e} not found`);
        }
        return createNodepingCheck(e,
            process.env.NODEPING_TOKEN as string,
            process.env.NODEPING_SUBACCOUNT_ID as string,
            Object.keys(contact['addresses'])[0] as string,
            process.env.APP as string);
    }));

}
