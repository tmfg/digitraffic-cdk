import {SpatialDisruption} from "../../lib/model/disruption";
import {FeatureCollection} from "geojson";
import moment from 'moment';
import {DISRUPTIONS_DATE_FORMAT} from "../../lib/service/disruptions";

export function someNumber() {
    return Math.floor(Math.random() * 999999);
}

export function newDisruption(): SpatialDisruption {
    // round off millis
    const StartDate = new Date();
    StartDate.setMilliseconds(0);
    const EndDate = new Date();
    EndDate.setMilliseconds(0);
    return {
        DescriptionEn: someNumber().toString(),
        DescriptionFi: someNumber().toString(),
        DescriptionSv: someNumber().toString(),
        EndDate,
        StartDate,
        Type_id: someNumber(),
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
        features: Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            const d = newDisruption();
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [Math.random() * 10, Math.random() * 10]
                },
                properties: {
                    ...d, ...{
                        StartDate: moment(d.StartDate).format(DISRUPTIONS_DATE_FORMAT),
                        EndDate: moment(d.EndDate).format(DISRUPTIONS_DATE_FORMAT)
                    }
                }
            }
        })
    };
}
