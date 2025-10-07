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

export interface DTActivity {
  readonly type: string;
  readonly reason?: string;
  readonly publicComment?: string;
  readonly startTime?: Date;
  readonly endTime?: Date;
}

interface BasePlannedAssistance {
  readonly queuePosition: number;
  readonly startTime: Date;
  readonly endTime: Date;
}

export interface AssistanceReceived extends BasePlannedAssistance {
  readonly assistingVessel: {
    readonly imo?: number;
    readonly mmsi?: number;
  };
}

export interface AssistanceGiven extends BasePlannedAssistance {
  readonly assistedVessel: {
    readonly imo?: number;
    readonly mmsi?: number;
  };
}

export type PlannedAssistance = AssistanceGiven | AssistanceReceived;

export function isAssistanceReceived(
  assistance: PlannedAssistance,
): assistance is AssistanceReceived {
  return "assistingVessel" in assistance;
}

export function isAssistanceGiven(
  assistance: PlannedAssistance,
): assistance is AssistanceGiven {
  return "assistedVessel" in assistance;
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
