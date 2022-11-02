import { Geometry } from "geojson";

export interface Disruption {
    Id: number;
    Type_Id: number;
    StartDate: Date;
    EndDate: Date;
    DescriptionFi: string;
    DescriptionSv?: string;
    DescriptionEn?: string;
}

export interface SpatialDisruption extends Disruption {
    geometry: Geometry;
}
