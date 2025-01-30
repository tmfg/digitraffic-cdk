export interface ApiDevice {
  readonly id: string;
  readonly description: string;
  readonly ioChannels: ApiIoChannel[];
}

export interface ApiIoChannel {
  readonly id: number;
  readonly enabled: boolean;
  readonly name: string;
}

export interface ApiWorkeventDevice {
  readonly deviceId: number;
  readonly deviceName: string;
  readonly workEvents: ApiWorkevent[];
}

export interface ApiWorkevent {
  readonly deviceId: number;
  readonly timest: string;
  readonly deviceName: string;
  readonly altitude: number;
  readonly heading: number;
  readonly ioChannels: ApiWorkeventIoDevice[];
  readonly lat: number;
  readonly lon: number;
  readonly speed: number;
  timestamp: Date;
}

export interface ApiWorkeventIoDevice {
  readonly id: number;
  readonly name: string;
}
