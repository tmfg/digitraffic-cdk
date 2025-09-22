// 0 == arrival, 1 == departure
export type TimeTableRowType = 0 | 1;

export interface UnknownDelayOrTrack {
  readonly stationShortCode: string;
  readonly scheduledTime: Date;
  readonly type: TimeTableRowType;
  readonly unknownDelay: boolean;
  readonly unknownTrack: boolean;
}

export interface UnknownDelayOrTrackMessage {
  readonly messageId: string;
  readonly recordedAtTime: Date;
  readonly trainNumber: number;
  readonly departureDate: string; // YYYYMMDD
  readonly vehicleJourneyName: string;

  readonly data: UnknownDelayOrTrack[];
}
