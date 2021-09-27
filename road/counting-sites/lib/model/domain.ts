import {Geometry} from "wkx";

export type DbDomain = {
    readonly name: string,
    readonly description: string,
    readonly added_timestamp: Date,
    readonly removed_timestamp?: Date
}

export type DbCounter = {
    readonly id: number,
    readonly site_id: number,
    readonly domain_name: string,
    readonly site_domain: string,
    readonly name: string,
    readonly location: Geometry,
    readonly user_type_id: number,
    readonly interval: number,
    readonly direction: number,
    readonly added_timestamp: Date,
    readonly last_data_timestamp?: Date,
    readonly removed_timestamp?: Date
}
