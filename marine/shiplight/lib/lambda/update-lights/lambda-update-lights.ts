import * as AreaTrafficService from '../../service/areatraffic';

export async function handler() {
    const areas = await AreaTrafficService.getAreaTraffic();
    // TODO send
}
