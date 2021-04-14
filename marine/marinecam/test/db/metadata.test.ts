import * as pgPromise from "pg-promise";
import {dbTestBase, insertCamera, insertCameraGroup} from "../db-testutil";
import {getAllCameraIds, getAllCameras, updateCameraMetadata} from "../../lib/db/metadata";

const GROUP_SAIMAA = 'Saimaa';
const GROUP_LOIMAA = 'Loimaa';

describe('db-metadata', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('getIds - empty', async () => {
        const ids = await getAllCameraIds(db);

        expect(ids.length).toEqual(0);
    });

    test('getIds', async () => {
        await insertCameraGroup(db, GROUP_SAIMAA, GROUP_SAIMAA);
        await insertCamera(db, '1', 'kamera1', GROUP_SAIMAA);
        await insertCamera(db, '2', 'kamera2', GROUP_SAIMAA);

        const ids = await getAllCameraIds(db);

        expect(ids.length).toEqual(2);
        expect(ids).toContain('1');
        expect(ids).toContain('2');
    });

    test('getCameras-Saimaa', async () => {
        await insertCameraGroup(db, GROUP_SAIMAA, GROUP_SAIMAA);
        await insertCamera(db, '1', 'kamera1', GROUP_SAIMAA);
        await insertCamera(db, '2', 'kamera2', GROUP_SAIMAA);

        const cameras = await getAllCameras(db, [GROUP_SAIMAA]);
        expect(cameras.length).toEqual(2);

        const cameras2 = await getAllCameras(db, [GROUP_SAIMAA, GROUP_LOIMAA]);
        expect(cameras2.length).toEqual(2);

        const noCameras = await getAllCameras(db, [GROUP_LOIMAA]);
        expect(noCameras.length).toEqual(0);
    });

    test('getCameras-Saimaa-Loimaa', async () => {
        await insertCameraGroup(db, GROUP_SAIMAA, GROUP_SAIMAA);
        await insertCameraGroup(db, GROUP_LOIMAA, GROUP_LOIMAA);
        await insertCamera(db, '1', 'kamera1', GROUP_SAIMAA);
        await insertCamera(db, '2', 'kamera2', GROUP_LOIMAA);

        const cameras = await getAllCameras(db, [GROUP_SAIMAA]);
        expect(cameras.length).toEqual(1);

        const cameras2 = await getAllCameras(db, [GROUP_SAIMAA, GROUP_LOIMAA]);
        expect(cameras2.length).toEqual(2);

        const noCameras = await getAllCameras(db, [GROUP_LOIMAA]);
        expect(noCameras.length).toEqual(1);
    });

    test('updateMetadata-not found', async () => {
        await updateCameraMetadata(db, 'nonexistent', new Date());
    });

    test('updateMetadata', async () => {
        await insertCameraGroup(db, GROUP_SAIMAA, GROUP_SAIMAA);
        await insertCamera(db, '1', 'kamera1', GROUP_SAIMAA);

        const cameras = await getAllCameras(db, [GROUP_SAIMAA]);
        expect(cameras.length).toEqual(1);
        expect(cameras[0].lastUpdated).toBeDefined();

        const newDate = new Date();
        newDate.setSeconds(0, 0);
        await updateCameraMetadata(db, '1', newDate);

        const cameras2 = await getAllCameras(db, [GROUP_SAIMAA]);
        expect(cameras2.length).toEqual(1);
        expect(cameras2[0].lastUpdated).toEqual(newDate);
    });
}));