import * as JsonUpdateService from "../../lib/service/json-update-service";
import {TloikLaite, TloikMetatiedot} from "../../lib/model/metatiedot";
import {dbTestBase} from "../db-testutil";
import {DTDatabase} from "digitraffic-common/database/database";
import {TloikLiikennemerkinTila, TloikTilatiedot} from "../../lib/model/tilatiedot";

const TEST_DEVICE: TloikLaite = {
    tunnus: 'test',
    sijainti: {
        tieosoite: '',
        ajosuunta: '',
        ajorata: '',
        n: 30,
        e: 30,
    },
    tyyppi: 'test',
};

const TEST_DEVICE_DATA: TloikLiikennemerkinTila = {
    tunnus: 'test',
    voimaan: new Date(),
    rivit: [{
        naytto: 1,
        rivi: 1,
        teksti: 'row1',
    }, {
        naytto: 1,
        rivi: 2,
        teksti: 'row2',
    }],
    luotettavuus: '12',
};

describe('json-update-service-tests', dbTestBase((db) => {
    test('update metadata - empty', async () => {
        const metadata: TloikMetatiedot = { laitteet: []};
        await JsonUpdateService.updateJsonMetadata(metadata);

        assertDeviceCount(db, 0);
    });

    test('update metadata - insert one device', async () => {
        const metadata: TloikMetatiedot = { laitteet: [TEST_DEVICE]};
        await JsonUpdateService.updateJsonMetadata(metadata);

        assertDeviceCount(db, 1);
    });

    test('update metadata - insert then update', async () => {
        const metadata: TloikMetatiedot = { laitteet: [TEST_DEVICE]};
        await JsonUpdateService.updateJsonMetadata(metadata);

        assertDeviceCount(db, 1);
        const created = await getUpdatedDate(db, 'test');

        await new Promise(resolve => setTimeout(resolve, 1000));

        await JsonUpdateService.updateJsonMetadata(metadata);
        const updated = await getUpdatedDate(db, 'test');

        assertDeviceCount(db, 1);
        expect(updated.getTime()).toBeGreaterThan(created.getTime());
    });

    test('update data - empty', async () => {
        const tilatiedot: TloikTilatiedot = {liikennemerkit: []};
        await JsonUpdateService.updateJsonData(tilatiedot);

        await assertDeviceDataCount(db, 0);
    });

    test('update data - one', async () => {
        const tilatiedot: TloikTilatiedot = {liikennemerkit: [TEST_DEVICE_DATA]};
        await JsonUpdateService.updateJsonData(tilatiedot);

        await assertDeviceDataCount(db, 1);
    });

}));

function assertDeviceCount(db: DTDatabase, expected: number) {
    db.one('select count(*) from device')
        .then(value => expect(value.count).toEqual(expected));
}

function assertDeviceDataCount(db: DTDatabase, expected: number) {
    db.one('select count(*) from device_data')
        .then(value => expect(value.count).toEqual(expected));
}

function getUpdatedDate(db: DTDatabase, id: string): Promise<Date> {
    return db.one('select updated_date from device where id = $1', [id])
        .then(value => value.updated_date);
}