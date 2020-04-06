import {SpatialDisruption} from "../../lib/model/disruption";
import {FeatureCollection} from "geojson";

function someNumber() {
    return Math.floor(Math.random() * 999999);
}

export function newDisruption(): SpatialDisruption {
    // round off millis
    const StartDate = new Date();
    StartDate.setMilliseconds(0);
    const EndDate = new Date();
    EndDate.setMilliseconds(0);
    return {
        AdditionalInformationEn: someNumber().toString(),
        AdditionalInformationFi: someNumber().toString(),
        AdditionalInformationSv: someNumber().toString(),
        DescriptionEn: someNumber().toString(),
        DescriptionFi: someNumber().toString(),
        DescriptionSv: someNumber().toString(),
        EndDate,
        StartDate,
        Type_Id: someNumber(),
        Id: someNumber(),
        geometry: {
            type: "Point",
            coordinates: [someNumber(), someNumber()]
        }
    };
}

export function disruptionFeatures(): FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: Array.from({length: Math.floor(Math.random() * 10)}).map(() => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [Math.random() * 10, Math.random() * 10]
            },
            properties: newDisruption()
        }))
    };
}
