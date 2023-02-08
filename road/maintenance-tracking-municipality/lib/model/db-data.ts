// eslint-disable camelcase
import {
    GeoJsonPoint,
    GeoJsonLineString,
} from "@digitraffic/common/dist/utils/geojson-types";

export interface DbWorkMachine {
    readonly harjaId: bigint;
    readonly harjaUrakkaId: bigint;
    readonly type: string;
}

export interface DbMaintenanceTracking {
    readonly id?: number | null;
    readonly sending_system: string;
    readonly sending_time: Date;
    readonly last_point: GeoJsonPoint;
    geometry: GeoJsonPoint | GeoJsonLineString;
    readonly work_machine_id: number;
    start_time: Date;
    readonly end_time: Date;
    readonly direction?: number;
    finished: boolean;
    readonly domain: string;
    readonly contract: string;
    readonly message_original_id: string;
    readonly tasks: string[];
    previous_tracking_id?: number | null;
    // This is additional meta data, not saved to db, but used to update previous tracking
    start_direction?: number; //
}

export interface DbLatestTracking {
    readonly id: number;
    readonly last_point: string;
    readonly end_time: Date;
    readonly finished: boolean;
    readonly tasks: string[];
}

export interface DbNumberId {
    readonly id: number;
}

export interface DbTextId {
    readonly id: string;
}

export interface DbDomain {
    readonly name: string;
    readonly source: string;
    readonly created?: Date;
    readonly modified?: Date;
}

export interface DbDomainContract {
    readonly domain: string;
    readonly contract: string;
    readonly name: string;
    readonly source?: string;
    readonly start_date?: Date;
    readonly end_date?: Date;
    readonly data_last_updated?: Date;
}

export interface DbDomainTaskMapping {
    readonly name: string;
    readonly original_id: string;
    readonly domain: string;
    readonly ignore: boolean;
}
