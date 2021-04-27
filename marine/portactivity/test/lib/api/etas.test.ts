import {getPortAreaGeometryForShip} from "../../../lib/api/etas";
import {getPortAreaGeometries} from "../../../lib/service/portareas";

describe('api-etas', () => {

    const geometries = getPortAreaGeometries();
    const hankoWest =
        geometries.find(g => g.locode == 'FIHKO')!.default!;
    const hankoOut =
        geometries.find(g => g.locode == 'FIHKO')!.areas.find(a => a.portAreaCode == 'OUT')!;
    const hankoKov =
        geometries.find(g => g.locode == 'FIHKO')!.areas.find(a => a.portAreaCode == 'KOV')!;
    const helsinkiVuos =
        geometries.find(g => g.locode == 'FIHEL')!.areas.find(a => a.portAreaCode == 'VUOS')!;

    test('getPortAreaGeometryForShip - FIHKO/OUT', () => {
        const geometry = getPortAreaGeometryForShip(geometries, {
            portcall_id: 0,
            locode: 'FIHKO',
            port_area_code: 'OUT',
            imo: 1
        });

        expect(geometry?.latitude).toBe(hankoOut.latitude);
        expect(geometry?.longitude).toBe(hankoOut.longitude);
    });

    test('getPortAreaGeometryForShip - FIHKO/KOV', () => {
        const geometry = getPortAreaGeometryForShip(geometries, {
            portcall_id: 0,
            locode: 'FIHKO',
            port_area_code: 'KOV',
            imo: 1
        });

        expect(geometry?.latitude).toBe(hankoKov.latitude);
        expect(geometry?.longitude).toBe(hankoKov.longitude);
    });

    test('getPortAreaGeometryForShip - FIHKO default is WEST', () => {
        const geometry = getPortAreaGeometryForShip(geometries, {
            portcall_id: 0,
            locode: 'FIHKO',
            port_area_code: 'TESTTESTTEST',
            imo: 1
        });

        expect(geometry?.latitude).toBe(hankoWest.latitude);
        expect(geometry?.longitude).toBe(hankoWest.longitude);
    });

    test('getPortAreaGeometryForShip - FIHEL/VUOS', () => {
        const geometry = getPortAreaGeometryForShip(geometries, {
            portcall_id: 0,
            locode: 'FIHEL',
            port_area_code: 'VUOS',
            imo: 1
        });

        expect(geometry?.latitude).toBe(helsinkiVuos.latitude);
        expect(geometry?.longitude).toBe(helsinkiVuos.longitude);
    });

    test('getPortAreaGeometryForShip - FIHEL no default', () => {
        const geometry = getPortAreaGeometryForShip(geometries, {
            portcall_id: 0,
            locode: 'FIHEL',
            port_area_code: 'TESTTESTTEST',
            imo: 1
        });

        expect(geometry).toBeNull();
    });

});