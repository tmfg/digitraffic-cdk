export interface Disruption {
    Id: number;
    Type_Id: number;
    StartDate: Date;
    EndDate: Date;
    DescriptionFi: string;
    DescriptionSv?: string;
    DescriptionEn?: string;
    AdditionalInformationFi?: string;
    AdditionalInformationSv?: string;
    AdditionalInformationEn?: string;
}

export interface SpatialDisruption extends Disruption {
    geometry: any
}
