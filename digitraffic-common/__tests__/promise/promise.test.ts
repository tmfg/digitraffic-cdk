import {retry} from "../../promise/promise";
import {getRandomInteger} from "../../test/testutils";

describe('Promise utils tests', () => {

    test('retry - no retries', async () => {
        const fn = jest.fn().mockResolvedValue(1);

        const ret = await retry(fn, 0, false);

        expect(ret).toBe(1);
        expect(fn.mock.calls.length).toBe(1);
    });

    test('retry - error with n+1 retries', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const retries = getRandomInteger(1, 10);

        try {
            await retry(fn, retries, false);
        } catch {
            // ignore
        } finally {
            expect(fn.mock.calls.length).toBe(retries + 1);
        }
    });

    test('retry - no error with n+1 retries', async () => {
        const fn = jest.fn().mockResolvedValue(1);
        const retries = getRandomInteger(1, 10);

        const ret = await retry(fn, retries, false);

        expect(ret).toBe(1);
        expect(fn.mock.calls.length).toBe(1);
    });

    test('retry - errors with no error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        try {
            await retry(fn, getRandomInteger(0, 10), false);
        } catch {
            // ignore
        } finally {
            expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
            consoleErrorSpy.mockRestore();
        }
    });

    test('retry - no retries with error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        try {
            await retry(fn, 0, true);
        } catch {
            // ignore
        } finally {
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            consoleErrorSpy.mockRestore();
        }
    });

    test('retry - retries with error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const retries = getRandomInteger(1, 10);
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        try {
            await retry(fn, retries, true);
        } catch {
            // ignore
        } finally {
            expect(consoleErrorSpy).toHaveBeenCalledTimes(retries + 1);
            consoleErrorSpy.mockRestore();
        }
    });

    test('retry - exceeded retry count throws error', async () => {
        const fn = jest.fn().mockRejectedValue('error');

        await expect(() => retry(fn, 3, true)).rejects.toThrow();
    });

    test('retry - defaults', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        try {
            await retry(fn);
        } catch {
            // ignore
        } finally {
            expect(fn.mock.calls.length).toBe(3 + 1);
            expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
        }
    });

    test('retry - NaN throws error', async () => {
        const fn = jest.fn();

        await expect(() => retry(fn, NaN, false)).rejects.toThrow();
    });

    test('retry - Infinity throws error', async () => {
        const fn = jest.fn();

        await expect(() => retry(fn, Infinity, false)).rejects.toThrow();
    });

    test('retry - exceeded maximum retry count throws error', async () => {
        const fn = jest.fn();

        await expect(() => retry(fn, getRandomInteger(101, 1000000), false)).rejects.toThrow();
    });

    test('retry - use without mocks without retry', async () => {
        const val = 1;
        const fn = () => Promise.resolve(val);

        const ret = await retry(fn);

        expect(ret).toBe(val);
    });

    test('retry - use without mocks with retry', async () => {
        let i = 0;
        const val = 1;
        const fn = () => {
            if (i < 3) {
                i++;
                throw new Error('not yet');
            }
            return Promise.resolve(val);
        };

        const ret = await retry(fn);

        expect(ret).toBe(val);
    });
});
