export interface Disruption {
    Id: number;
    Type_id: number;
    StartDate: Date;
    EndDate: Date;
    DescriptionFi: string;
    DescriptionSv?: string;
    DescriptionEn?: string;
}

export interface SpatialDisruption extends Disruption {
    geometry: any
}
