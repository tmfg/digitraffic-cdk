import * as pgPromise from "pg-promise";
import {dbTestBase, insertDisruption} from "../db-testutil";
import {newDisruption} from "../testdata";
import {findAll, updateDisruptions} from "../../../lib/db/db-disruptions";
import {Geometry} from "wkx";

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

        await Promise.all(updateDisruptions(db, [disruption]));

        const fetchedDisruptions = await findAll(db, (d) => d);

        expect(fetchedDisruptions.length).toBe(1);
        const fd = fetchedDisruptions[0];
        expect(Number(fd.id)).toBe(disruption.Id);
        expect(Number(fd.type_id)).toBe(disruption.Type_Id);
        expect(fd.start_date).toMatchObject(disruption.StartDate);
        expect(fd.end_date).toMatchObject(disruption.EndDate);
        expect(fd.description_fi).toBe(disruption.DescriptionFi);
        expect(fd.description_sv).toBe(disruption.DescriptionSv);
        expect(fd.description_en).toBe(disruption.DescriptionEn);
        expect(fd.additional_info_fi).toBe(disruption.AdditionalInformationFi);
        expect(fd.additional_info_sv).toBe(disruption.AdditionalInformationSv);
        expect(fd.additional_info_en).toBe(disruption.AdditionalInformationEn);
        expect(Geometry.parse(Buffer.from(fd.geometry, "hex")).toGeoJSON()).toMatchObject(disruption.geometry);
    });

    test('updateDisruptions - update', async () => {
        const disruption = newDisruption();
        await insertDisruption(db, [disruption]);
        const updatedDisruption = newDisruption();
        updatedDisruption.Id = disruption.Id;

        await Promise.all(updateDisruptions(db, [updatedDisruption]));

        const fetchedDisruptions = await findAll(db, (d) => d)
        expect(fetchedDisruptions.length).toBe(1);
        const fd = fetchedDisruptions[0];
        expect(Number(fd.type_id)).toBe(updatedDisruption.Type_Id);
        expect(fd.start_date).toMatchObject(updatedDisruption.StartDate);
        expect(fd.end_date).toMatchObject(updatedDisruption.EndDate);
        expect(fd.description_fi).toBe(updatedDisruption.DescriptionFi);
        expect(fd.description_sv).toBe(updatedDisruption.DescriptionSv);
        expect(fd.description_en).toBe(updatedDisruption.DescriptionEn);
        expect(fd.additional_info_fi).toBe(updatedDisruption.AdditionalInformationFi);
        expect(fd.additional_info_sv).toBe(updatedDisruption.AdditionalInformationSv);
        expect(fd.additional_info_en).toBe(updatedDisruption.AdditionalInformationEn);
        expect(Geometry.parse(Buffer.from(fd.geometry, "hex")).toGeoJSON()).toMatchObject(updatedDisruption.geometry);
    });
}));
