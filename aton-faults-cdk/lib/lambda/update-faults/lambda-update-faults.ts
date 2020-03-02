import {getFaults} from "../../api/get-faults";
import {saveFaults} from "../../service/faults";

// Commercial / Non-Commercial _ Navigation Aids / Navigation Marks
const integrations = [
    { domain: 'C_NA', url: 'https://testiextranet.vayla.fi/pooki_www/services/rest.ashx?layer=kaupvayl_vi_dt&crs=EPSG:4326' },
    { domain: 'NC_NA', url: 'https://testiextranet.vayla.fi/pooki_www/services/rest.ashx?layer=muuvayl_vi_dt&crs=EPSG:4326' },
    { domain: 'C_NM', url: 'https://testiextranet.vayla.fi/pooki_www/services/rest.ashx?layer=kaupvayl_vlm_vi_dt&crs=EPSG:4326' },
    { domain: 'NC_NM', url: 'https://testiextranet.vayla.fi/pooki_www/services/rest.ashx?layer=muuvayl_vlm_vi_dt&crs=EPSG:4326' },
];

export const handler = async () : Promise <any> => {
    await updateAllFaults();
};

async function updateAllFaults(): Promise<any> {
    for(const i of integrations) {
        const newFaults = await getFaults(i.url);

        await saveFaults(i.domain, newFaults);
    }
}

interface Integration {
    url: string,
    domain: string
}
