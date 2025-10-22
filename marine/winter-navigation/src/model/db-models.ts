import type {
  BaseAttributes,
  Dirwaypoint,
  Location,
  PortSuspension,
  Restriction,
} from "./apidata.js";

export interface PortSuspensionWithLocations {
  readonly id: string;
  readonly start_time: Date;
  readonly end_time?: Date;
  readonly prenotification: string;
  readonly ports_closed: boolean;
  readonly due_to: string;
  readonly specifications?: string;

  // from locations
  readonly location_id: string;
}

export interface DirwayWithPoints extends BaseAttributes {
  readonly name: string;
  readonly description: string;
  readonly dirwaypoints: Dirwaypoint[];
}

export interface LocationWithRelations extends BaseAttributes {
  readonly name: string;
  readonly type: string;
  readonly locode_list: string;
  readonly nationality: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly winterport: boolean;
  readonly restrictions: Restriction[];
  readonly suspensions: PortSuspension[];
}
