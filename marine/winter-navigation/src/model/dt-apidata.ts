export interface DTRestriction {
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly textCompilation: string;
}

export interface DTSuspension {
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly prenotification: string;
  readonly portsClosed: boolean;
  readonly dueTo: string;
  readonly specifications?: string;
}

export interface DTLocation {
  readonly name: string;
  readonly type: string;
  readonly locodeList: string;
  readonly nationality: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly winterport: boolean;
  readonly restrictions?: DTRestriction[];
  readonly suspensions?: DTSuspension[];
}

interface BasePlannedAssistance {
  readonly queuePosition: number;
  readonly startTime: Date;
  readonly endTime?: Date;
}

export interface AssistanceReceivedVessel {
  readonly assistingVessel: {
    readonly imo?: number;
    readonly mmsi?: number;
    readonly name: string;
  };
}

export interface AssistanceGivenVessel {
  readonly assistedVessel: {
    readonly imo?: number;
    readonly mmsi?: number;
    readonly name: string;
  };
}

export type AssistanceReceived =
  & BasePlannedAssistance
  & AssistanceReceivedVessel;
export type AssistanceGiven = BasePlannedAssistance & AssistanceGivenVessel;
export type PlannedAssistance = AssistanceGiven | AssistanceReceived;

export interface DTBaseActivity {
  readonly type: string;
  readonly reason?: string;
  readonly publicComment?: string;
  readonly startTime?: Date;
  readonly endTime?: Date;
}

export type DTActivity =
  | DTBaseActivity
  | DTBaseActivity & AssistanceReceivedVessel
  | DTBaseActivity & AssistanceGivenVessel;

export function isAssistanceReceived(
  a: PlannedAssistance | DTActivity,
): a is AssistanceReceived | (DTActivity & AssistanceReceivedVessel) {
  return "assistingVessel" in a;
}

export function isAssistanceGiven(
  a: PlannedAssistance | DTActivity,
): a is AssistanceGiven | (DTActivity & AssistanceGivenVessel) {
  return "assistedVessel" in a;
}

export interface DTVessel {
  readonly name: string;
  readonly callSign?: string;
  readonly shortcode?: string;
  readonly imo?: number;
  readonly mmsi?: number;
  readonly type?: string;
  readonly activities?: DTActivity[];
  readonly plannedAssistances?: PlannedAssistance[];
}

export interface DTDirwaypoint {
  readonly orderNum: number;
  readonly name?: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface DTDirway {
  readonly name: string;
  readonly description: string;
  readonly dirwaypoints?: DTDirwaypoint[];
}
