import * as pgPromise from "pg-promise";
import {dbTestBase, insertDisruption} from "../db-testutil";
import {newDisruption} from "../testdata";
import {findAll, updateDisruptions} from "../../../lib/db/db-disruptions";
import {Geometry} from "wkx";
import {Disruption} from "../../../lib/model/disruption";

describe('db-disruptions', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('findAll', async () => {
        const disruptions = Array.from({length: Math.floor(Math.random() * 10)}).map(() => {
            return newDisruption();
        });
        await insertDisruption(db, disruptions);

        const fetchedDisruptions = await findAll(db);

        expect(fetchedDisruptions.length).toBe(disruptions.length);
    });

    test('updateDisruptions - insert', async () => {
        const disruption = newDisruption();

        await Promise.all(updateDisruptions(db, [disruption]));

        const fetchedDisruptions = await findAll(db);

        expect(fetchedDisruptions.length).toBe(1);
        const fd = fetchedDisruptions[0].properties as Disruption;
        expect(Number(fd.Id)).toBe(disruption.Id);
        expect(Number(fd.Type_id)).toBe(disruption.Type_id);
        expect(fd.StartDate).toMatchObject(disruption.StartDate);
        expect(fd.EndDate).toMatchObject(disruption.EndDate);
        expect(fd.DescriptionFi).toBe(disruption.DescriptionFi);
        expect(fd.DescriptionSv).toBe(disruption.DescriptionSv);
        expect(fd.DescriptionEn).toBe(disruption.DescriptionEn);
        expect(fetchedDisruptions[0].geometry).toMatchObject(disruption.geometry);
    });

    test('updateDisruptions - update', async () => {
        const disruption = newDisruption();
        await insertDisruption(db, [disruption]);
        const updatedDisruption = newDisruption();
        updatedDisruption.Id = disruption.Id;

        await Promise.all(updateDisruptions(db, [updatedDisruption]));

        const fetchedDisruptions = await findAll(db);
        expect(fetchedDisruptions.length).toBe(1);
        const fd = fetchedDisruptions[0].properties as Disruption;
        expect(Number(fd.Type_id)).toBe(updatedDisruption.Type_id);
        expect(fd.StartDate).toMatchObject(updatedDisruption.StartDate);
        expect(fd.EndDate).toMatchObject(updatedDisruption.EndDate);
        expect(fd.DescriptionFi).toBe(updatedDisruption.DescriptionFi);
        expect(fd.DescriptionSv).toBe(updatedDisruption.DescriptionSv);
        expect(fd.DescriptionEn).toBe(updatedDisruption.DescriptionEn);
        expect(fetchedDisruptions[0].geometry).toMatchObject(updatedDisruption.geometry);
    });
}));
