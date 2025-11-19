/**
 * A simple asserter-class for writing canaries without dependency to testing-libraries.
 */

type AssertedValue = string | number;

export const Asserter = {
  assertEquals(value: AssertedValue, expected: AssertedValue): void {
    if (value !== expected) {
      throw new Error(`Given value ${value} was not expected ${expected}`);
    }
  },

  assertTrue(value: boolean): void {
    if (!value) {
      throw new Error(`Given value was not true`);
    }
  },

  assertLength<T>(data: T[] | undefined, expected: number): void {
    if (!data) {
      throw new Error("Given array was not defined");
    }

    if (data.length !== expected) {
      throw new Error(
        `Given array length ${data.length} was not expected ${expected}`,
      );
    }
  },

  assertLengthGreaterThan<T>(data: T[] | undefined, expected: number): void {
    if (!data) {
      throw new Error("Given array was not defined");
    }

    if (data.length <= expected) {
      throw new Error(
        `Given array length ${data.length} was not greater than ${expected}`,
      );
    }
  },

  assertGreaterThan(value: number, expected: number): void {
    if (value <= expected) {
      throw new Error(
        `Value ${value} was expected to be greater than ${expected}`,
      );
    }
  },

  assertToBeCloseTo(value: number, expected: number, delta: number): void {
    expect(expected - value).toBeGreaterThanOrEqual(-1 * delta);
    expect(expected - value).toBeLessThanOrEqual(delta);
  },
};
