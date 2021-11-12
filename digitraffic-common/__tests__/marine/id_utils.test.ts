import * as IdUtils from '../../marine/id_utils';
import {getRandomNumber} from "../../test/testutils";

describe('IdUtils tests', () => {

    test('isValidLOCODE - success', () => {
        expect(IdUtils.isValidLOCODE('FILOL')).toBe(true);
    });

    test('isValidLOCODE - fail with non-finnish prefix', () => {
        expect(IdUtils.isValidLOCODE('SEABS')).toBe(false);
    });

    test('isValidLOCODE - fail with numbers', () => {
        expect(IdUtils.isValidLOCODE('FIAA1')).toBe(false);
    });

    test('isValidIMO - success', () => {
        expect(IdUtils.isValidIMO(9198977)).toBe(true);
    });

    test('isValidIMO - fail with number smaller than 1000000', () => {
        expect(IdUtils.isValidIMO(getRandomNumber(0, 1000000 - 1))).toBe(false);
    });

    test('isValidIMO - fail with number larger than 9999999', () => {
        expect(IdUtils.isValidIMO(getRandomNumber(9999999 + 1, 99999999))).toBe(false);
    });

    test('isValidMMSI - success', () => {
        expect(IdUtils.isValidMMSI(230927000)).toBe(true);
    });

    test('isValidMMSI - fail with number smaller than 100000000', () => {
        expect(IdUtils.isValidMMSI(getRandomNumber(0, 100000000 - 1))).toBe(false);
    });

    test('isValidMMSI - fail with number larger than 999999999', () => {
        expect(IdUtils.isValidMMSI(getRandomNumber(999999999 + 1, 9999999999))).toBe(false);
    });
});