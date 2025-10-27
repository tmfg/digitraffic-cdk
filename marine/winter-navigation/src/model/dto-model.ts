import type {
  Activity,
  DbData,
  Dirway,
  Dirwaypoint,
  Location,
  Queue,
  Restriction,
  Suspension,
  Vessel,
} from "./api-db-model.js";

export interface DirwayDTO extends DbData<Dirway> {
  readonly dirwaypoints: Dirwaypoint[];
}
export type SuspensionDTO = DbData<Suspension>;
export type RestrictionDTO = DbData<Restriction>;
export interface LocationDTO extends DbData<Location> {
  readonly restrictions: RestrictionDTO[];
  readonly suspensions: SuspensionDTO[];
}
export type QueueDTO = DbData<Queue> & {
  readonly icebreaker_imo?: number;
  readonly icebreaker_mmsi?: number;
  readonly icebreaker_name: string;
  readonly vessel_imo?: number;
  readonly vessel_mmsi?: number;
  readonly vessel_name: string;
};

export type ActivityDTO = DbData<Activity> & {
  readonly icebreaker_imo?: number;
  readonly icebreaker_mmsi?: number;
  readonly icebreaker_name: string;
  readonly vessel_imo?: number;
  readonly vessel_mmsi?: number;
  readonly vessel_name: string;
};

export interface VesselDTO extends DbData<Vessel> {
  readonly queues?: QueueDTO[];
  readonly activities?: ActivityDTO[];
}
