import * as ServicesDb from "../../db/services.js";
import { newService } from "../testdata.js";
import { dbTestBase } from "../db-testutil.js";

describe(
    "db-services",
    dbTestBase((db) => {
        test("findAll", async () => {
            const services = Array.from({ length: Math.floor(Math.random() * 10) }).map(() => {
                return newService();
            });
            await ServicesDb.update(services, db);

            const foundservices = await ServicesDb.findAll(db);

            // TODO match object, date millisecond difference
            expect(foundservices.length).toBe(services.length);
        });

        test("find - found", async () => {
            const service = newService();
            await ServicesDb.update([service], db);

            const foundservice = await ServicesDb.find(service.service_code, db);

            expect(foundservice).toMatchObject(service);
        });

        test("find - not found", async () => {
            const foundservice = await ServicesDb.find("lol", db);

            expect(foundservice).toBeNull();
        });

        test("update - deletes previous", async () => {
            const previousService = newService();
            await ServicesDb.update([previousService], db);

            const theNewService = newService();
            await ServicesDb.update([theNewService], db);

            const foundServices = await ServicesDb.findAll(db);

            expect(foundServices.length).toBe(1);
            expect(foundServices[0]).toMatchObject(theNewService);
        });
    })
);
