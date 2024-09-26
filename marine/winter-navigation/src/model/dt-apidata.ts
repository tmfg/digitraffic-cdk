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
    readonly restrictions?: DTRestriction[]
    readonly suspensions?: DTSuspension[]
};

export interface DTActivity {
    readonly type: string;
    readonly reason?: string;
    readonly publicComment?: string;
    readonly startTime?: Date;
    readonly endTime?: Date;
}

export interface DTVessel {
    readonly name: string;
    readonly callSign?: string;
    readonly shortcode?: string;
    readonly imo?: number;
    readonly mmsi?: number;
    readonly type?: string;
    readonly activities?: DTActivity[]
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
    readonly dirwaypoints?: DTDirwaypoint[]
}