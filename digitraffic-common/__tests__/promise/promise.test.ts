import {retry} from "../../promise/promise";
import {getRandomInteger} from "../../test/testutils";

describe('Promise utils tests', () => {

    test('retry with no retries', async () => {
        const fn = jest.fn();

        await retry(fn, 0, false);

        expect(fn.mock.calls.length).toBe(1);
    });

    test('retry with n+1 retries', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const retries = getRandomInteger(1, 10);

        await retry(fn, retries, false);

        expect(fn.mock.calls.length).toBe(retries);
    });

    test('no retry with n+1 retries', async () => {
        const fn = jest.fn();
        const retries = getRandomInteger(1, 10);

        await retry(fn, retries, false);

        expect(fn.mock.calls.length).toBe(1);
    });

    test('no retry - no error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        await retry(fn, 0, false);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
        consoleErrorSpy.mockRestore();
    });

    test('retry - no error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        await retry(fn, getRandomInteger(1, 10), false);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
        consoleErrorSpy.mockRestore();
    });

    test('no retry - error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        await retry(fn, 0, true);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        consoleErrorSpy.mockRestore();
    });

    test('retry - error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const retries = getRandomInteger(1, 10);
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        await retry(fn, retries, true);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(retries);
        consoleErrorSpy.mockRestore();
    });

});
