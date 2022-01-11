import {getRandomInteger} from "../../test/testutils";
import {retry, RetryLogError} from "../../utils/retry";

describe('Promise utils tests', () => {

    test('retry - no retries', async () => {
        const fn = jest.fn().mockResolvedValue(1);

        const ret = await retry(fn, 0, RetryLogError.NO_LOGGING);

        expect(ret).toBe(1);
        expect(fn.mock.calls.length).toBe(1);
    });

    test('retry - error with n+1 retries', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const retries = getRandomInteger(1, 10);

        try {
            await retry(fn, retries, RetryLogError.NO_LOGGING);
        } catch {
            // ignore
        } finally {
            expect(fn.mock.calls.length).toBe(retries + 1);
        }
    });

    test('retry - no error with n+1 retries', async () => {
        const fn = jest.fn().mockResolvedValue(1);
        const retries = getRandomInteger(1, 10);

        const ret = await retry(fn, retries, RetryLogError.NO_LOGGING);

        expect(ret).toBe(1);
        expect(fn.mock.calls.length).toBe(1);
    });

    test('retry - errors with no error logging', async () => {
        const fn = jest.fn().mockRejectedValue('error');
        const consoleErrorSpy = jest.spyOn(global.console, 'error').mockImplementation();

        try {
            await retry(fn, getRandomInteger(0, 10), RetryLogError.NO_LOGGING);
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
            await retry(fn, 0, RetryLogError.LOG_ALL_AS_ERRORS);
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
            await retry(fn, retries, RetryLogError.LOG_ALL_AS_ERRORS);
        } catch {
            // ignore
        } finally {
            expect(consoleErrorSpy).toHaveBeenCalledTimes(retries + 1);
            consoleErrorSpy.mockRestore();
        }
    });

    test('retry - exceeded retry count throws error', async () => {
        const fn = jest.fn().mockRejectedValue('error');

        await expect(() => retry(fn, 3, RetryLogError.LOG_ALL_AS_ERRORS)).rejects.toThrow();
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
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // last retry
        }
    });

    test('retry - NaN throws error', async () => {
        const fn = jest.fn();

        await expect(() => retry(fn, NaN, RetryLogError.NO_LOGGING)).rejects.toThrow();
    });

    test('retry - Infinity throws error', async () => {
        const fn = jest.fn();

        await expect(() => retry(fn, Infinity, RetryLogError.NO_LOGGING)).rejects.toThrow();
    });

    test('retry - exceeded maximum retry count throws error', async () => {
        const fn = jest.fn();

        await expect(() => retry(fn, getRandomInteger(101, 1000000), RetryLogError.NO_LOGGING)).rejects.toThrow();
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
