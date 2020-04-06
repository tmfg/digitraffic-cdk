import * as pgPromise from "pg-promise";
import {dbTestBase, insertDisruption} from "../db-testutil";
import {newDisruption} from "../testdata";
import {DbDisruption, findAll, updateDisruptions} from "../../../lib/db/db-disruptions";
import {Feature} from "geojson";
import {Geometry} from "wkx";
import {SpatialDisruption} from "../../../lib/model/disruption";

describe('db-disruptions', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('findAll', async () => {
        const disruptions = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newDisruption();
        });
        await insertDisruption(db, disruptions);

        const fetchedDisruptions = await findAll(db, (d) => d);

        expect(fetchedDisruptions.length).toBe(disruptions.length);
    });

    test('updateDisruptions - insert', async () => {
        const disruption = newDisruption();
        const feature: Feature = {
            type: 'Feature',
            geometry: {type: 'Point', coordinates: disruption.geometry.coordinates},
            properties: disruption
        };

        await Promise.all(updateDisruptions(db, [feature]));

        fetchAndCompare(disruption, await findAll(db, (d) => d));
    });

    test('updateDisruptions - update', async () => {
        const disruption = newDisruption();
        await insertDisruption(db, [disruption]);
        const updatedDisruption = newDisruption();
        updatedDisruption.Id = disruption.Id;

        const feature: Feature = {
            type: 'Feature',
            geometry: {type: 'Point', coordinates: disruption.geometry.coordinates},
            properties: disruption
        };

        await Promise.all(updateDisruptions(db, [feature]));

        fetchAndCompare(disruption, await findAll(db, (d) => d));
    });
}));

function fetchAndCompare(disruption: SpatialDisruption, fetchedDisruptions: DbDisruption[]) {
    expect(fetchedDisruptions.length).toBe(1);
    const fd = fetchedDisruptions[0];
    expect(Number(fd.bridgelock_id)).toBe(disruption.Id);
    expect(Number(fd.bridgelock_type_id)).toBe(disruption.Type_Id);
    expect(fd.start_date).toMatchObject(disruption.StartDate);
    expect(fd.end_date).toMatchObject(disruption.EndDate);
    expect(fd.description_fi).toBe(disruption.DescriptionFi);
    expect(fd.description_sv).toBe(disruption.DescriptionSv);
    expect(fd.description_en).toBe(disruption.DescriptionEn);
    expect(fd.additional_info_fi).toBe(disruption.AdditionalInformationFi);
    expect(fd.additional_info_sv).toBe(disruption.AdditionalInformationSv);
    expect(fd.additional_info_en).toBe(disruption.AdditionalInformationEn);
    expect(Geometry.parse(Buffer.from(fd.geometry, "hex")).toGeoJSON()).toMatchObject(disruption.geometry);
}
