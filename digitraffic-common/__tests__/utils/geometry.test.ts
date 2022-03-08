import * as geometry from '../../utils/geometry';
import {Asserter} from "../../test/asserter";

const TAMPERE_WGS84_X = 23.761290078;
const TAMPERE_WGS84_Y = 61.497742570;

const KUOPIO_WGS84_X = 27.688935;
const KUOPIO_WGS84_Y = 62.892983;
const TAMPERE_KUOPIO_DISTANCE_KM = 255.8;

describe('geometry tests', () => {

    test('distanceBetweenWGS84PointsInKm', () => {
        Asserter.assertToBeCloseTo(geometry.distanceBetweenPositionsInKm([TAMPERE_WGS84_X, TAMPERE_WGS84_Y], [KUOPIO_WGS84_X, KUOPIO_WGS84_Y]),TAMPERE_KUOPIO_DISTANCE_KM, 0.5);
        console.info(geometry.distanceBetweenPositionsInKm([TAMPERE_WGS84_X, TAMPERE_WGS84_Y], [KUOPIO_WGS84_X, KUOPIO_WGS84_Y]));
    });

    test('distanceBetweenWGS84PointsInKm', () => {
        Asserter.assertToBeCloseTo(geometry.distanceBetweenPositionsInM([TAMPERE_WGS84_X, TAMPERE_WGS84_Y], [KUOPIO_WGS84_X, KUOPIO_WGS84_Y]),TAMPERE_KUOPIO_DISTANCE_KM*1000, 500);
        console.info(geometry.distanceBetweenPositionsInM([TAMPERE_WGS84_X, TAMPERE_WGS84_Y], [KUOPIO_WGS84_X, KUOPIO_WGS84_Y]));
    });

});
