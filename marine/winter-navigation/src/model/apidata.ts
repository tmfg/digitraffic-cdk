export interface EndpointResponse {
    toRv: number;
}

export interface BaseAttributes {
    readonly rv: number;
    readonly id: string;
    readonly change_time: Date;
    readonly deleted: undefined;
}

export interface Deleted {
    readonly id: string;
    readonly deleted: true;
}

export type Response<T> = (T | Deleted)[];

export interface Location extends BaseAttributes {
    readonly name: string;
    readonly type: string;
    readonly locode_list: string;
    readonly nationality: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly winterport: boolean;
    readonly deleted: undefined;
}

export interface Restriction extends BaseAttributes {
    readonly location_id: string;
    readonly start_time: Date;
    readonly end_time?: Date;
    readonly text_compilation: string;
}

export interface Vessel extends BaseAttributes {
    readonly name: string;
    readonly callsign?: string;
    readonly shortcode: string;
    readonly imo?: number;
    readonly mmsi?: number;
    readonly type?: string;
}

export interface Source extends BaseAttributes {
    readonly name: string;
    readonly shortname?: string;
    readonly nationality: string;
    readonly type: string;
    readonly vessel_id?: string;
}

export interface Activity extends BaseAttributes {
    readonly icebreaker_id: string;
    readonly vessel_id?: string;
    readonly type: string;
    readonly reason?: string;
    readonly public_comment?: string;
    readonly start_time: Date;
    readonly end_time?: Date;
}
