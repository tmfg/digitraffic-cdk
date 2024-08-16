import { Asserter } from "../asserter.js";
import * as Geometry from "../../utils/geometry.js";

const TAMPERE_WGS84_X = 23.761290078;
const TAMPERE_WGS84_Y = 61.49774257;

const KUOPIO_WGS84_X = 27.688935;
const KUOPIO_WGS84_Y = 62.892983;
const TAMPERE_KUOPIO_DISTANCE_KM = 255.8;

describe("CommonGeometryTest", () => {
    test("distanceBetweenWGS84PointsInKm", () => {
        Asserter.assertToBeCloseTo(
            Geometry.distanceBetweenPositionsInKm(
                [TAMPERE_WGS84_X, TAMPERE_WGS84_Y],
                [KUOPIO_WGS84_X, KUOPIO_WGS84_Y],
            ),
            TAMPERE_KUOPIO_DISTANCE_KM,
            0.5,
        );
        console.info(
            Geometry.distanceBetweenPositionsInKm(
                [TAMPERE_WGS84_X, TAMPERE_WGS84_Y],
                [KUOPIO_WGS84_X, KUOPIO_WGS84_Y],
            ),
        );
    });

    test("distanceBetweenWGS84PointsInKm", () => {
        Asserter.assertToBeCloseTo(
            Geometry.distanceBetweenPositionsInM(
                [TAMPERE_WGS84_X, TAMPERE_WGS84_Y],
                [KUOPIO_WGS84_X, KUOPIO_WGS84_Y],
            ),
            TAMPERE_KUOPIO_DISTANCE_KM * 1000,
            500,
        );
        console.info(
            Geometry.distanceBetweenPositionsInM(
                [TAMPERE_WGS84_X, TAMPERE_WGS84_Y],
                [KUOPIO_WGS84_X, KUOPIO_WGS84_Y],
            ),
        );
    });

    test("areDistinctPositions", () => {
        expect(Geometry.areDistinctPositions([1, 2], [1, 2])).toBe(false);
        expect(Geometry.areDistinctPositions([1.1, 2.2], [1.1, 2.2])).toBe(
            false,
        );
        expect(Geometry.areDistinctPositions([1, 2.1], [1, 2])).toBe(true);
        expect(
            Geometry.areDistinctPositions([1, 2], [1, 2.000000000000001]),
        ).toBe(true);
    });
});
