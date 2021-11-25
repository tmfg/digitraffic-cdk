import {retry} from "../../promise/promise";
import {getRandomInteger} from "../../test/testutils";

describe('Promise utils tests', () => {

    test('retry - no retries', async () => {
        const fn = jest.fn();

        await retry(fn, 0, false);

        expect(fn.mock.calls.length).toBe(1);
    });

    test('retry - error with n+1 retries', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const retries = getRandomInteger(1, 10);

        await retry(fn, retries, false);

        expect(fn.mock.calls.length).toBe(retries);
    });

    test('retry - no error with n+1 retries', async () => {
        const fn = jest.fn();
        const retries = getRandomInteger(1, 10);

        await retry(fn, retries, false);

        expect(fn.mock.calls.length).toBe(1);
    });

    test('retry - errors with no error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        await retry(fn, getRandomInteger(0, 10), false);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
        consoleErrorSpy.mockRestore();
    });

    test('retry - no retries with error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        await retry(fn, 0, true);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        consoleErrorSpy.mockRestore();
    });

    test('retry - retries with error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const retries = getRandomInteger(1, 10);
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        await retry(fn, retries, true);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(retries);
        consoleErrorSpy.mockRestore();
    });

    test('retry - defaults', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        await retry(fn);

        expect(fn.mock.calls.length).toBe(3);
        expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
    });

    test('retry - NaN throws error', async () => {
        const fn = jest.fn().mockRejectedValue('aa');

        await expect(() => retry(fn, NaN, false)).rejects.toThrow();
    });

});
