export interface EndpointResponse {
  toRv: number;
}

export interface DbMetaData {
  readonly id: string;
}

export interface ApiMetaData {
  readonly id: string;
  readonly rv: number;
  readonly change_time: Date;
  readonly deleted: undefined;
}

type WithTimeStrings<T> = Omit<T, "start_time" | "end_time"> & {
  start_time: string;
  end_time?: string;
};

export type ApiData<T> = T & ApiMetaData;
// date fields in the db are returned as strings in the js object
export type DbData<T> = WithTimeStrings<T> & DbMetaData;

export interface Deleted {
  readonly id: string;
  readonly deleted: true;
}

export type Response<T> = (T | Deleted)[];

export interface Location {
  readonly name: string;
  readonly type: string;
  readonly locode_list: string;
  readonly nationality: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly winterport: boolean;
  readonly deleted: undefined;
}

export interface Restriction {
  readonly location_id: string;
  readonly start_time: Date;
  readonly end_time?: Date;
  readonly text_compilation: string;
}

export interface Vessel {
  readonly name: string;
  readonly callsign?: string;
  readonly shortcode?: string;
  readonly imo?: number;
  readonly mmsi?: number;
  readonly type?: string;
}

export interface Source {
  readonly name: string;
  readonly shortname?: string;
  readonly nationality: string;
  readonly type: string;
  readonly vessel_id?: string;
}

export interface Activity {
  readonly icebreaker_id: string;
  readonly vessel_id?: string;
  readonly type: string;
  readonly reason?: string;
  readonly public_comment?: string;
  readonly start_time: Date;
  readonly end_time?: Date;
}

export interface Suspension {
  readonly start_time: Date;
  readonly end_time?: Date;
  readonly prenotification: boolean;
  readonly ports_closed: boolean;
  readonly due_to: string;
  readonly specifications?: string;
}

export interface PortSuspensionLocation {
  readonly suspension_id: string;
  readonly location_id: string;
}

export interface Queue {
  readonly icebreaker_id: string;
  readonly vessel_id: string;
  readonly start_time: Date;
  readonly end_time?: Date;
  readonly order_num: number;
}

export interface Dirway {
  readonly name: string;
  readonly description: string;
}

export interface Dirwaypoint {
  readonly dirway_id: string;
  readonly order_num: number;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
}
