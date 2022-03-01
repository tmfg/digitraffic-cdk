import axios from 'axios';
import * as util from 'util';
import * as xml2js from 'xml2js';

export enum SchedulesDirection {
    EAST = 'east',
    WEST = 'west',
}

export class SchedulesApi {
    private readonly url: string;

    constructor(url: string) {
        this.url = url;
    }

    async getSchedulesTimestamps(direction: SchedulesDirection, calculated: boolean): Promise<SchedulesResponse> {
        const start = Date.now();
        const fullUrl = this.createUrl(direction, calculated);
        console.info('method=getSchedulesTimestamp from URL=%s', fullUrl);
        const resp = await axios.get(fullUrl);
        const parse = util.promisify(xml2js.parseString);
        console.info('method=getSchedulesTimestamp tookMs=%d', (Date.now() - start));
        return await parse(resp.data) as SchedulesResponse;
    }

    private createUrl(direction: SchedulesDirection, calculated: boolean): string {
        return `${this.url}/${direction}${calculated ? '/calculated' : ''}`;
    }

}

// xmljs creates arrays of most child elements since in XML we can't be sure of the amount

export interface Timestamp {
    readonly $: {
        readonly time: string
        readonly uts: string
    }
}

export interface Destination {
    readonly $: {
        readonly destination?: string
        readonly locode: string
        readonly portfacility?: string
    }
}

export interface Vessel {
    readonly $: {
        readonly vesselName: string
        readonly callsign: string
        readonly mmsi: string
        readonly imo: string
    }
}

export interface ScheduleTimetable {
    readonly destination?: Destination[]
    readonly eta?: Timestamp[]
    readonly etd?: Timestamp[]
}

export interface Schedule {
    readonly $: {
        readonly UUID: string
    }
    readonly vessel: Vessel[]
    readonly timetable: ScheduleTimetable[]
}

export interface SchedulesResponse {
    readonly schedules: {
        readonly schedule: Schedule[]
    }
}
