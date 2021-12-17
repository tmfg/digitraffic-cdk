import { Stack } from "aws-cdk-lib";
import * as StackUtil from "../../stack/stack-util";

describe('stack-util tests', () => {
    function assertFullEnv(stackName: string, expected: string) {
        const stack = new Stack(undefined, "name", {
            stackName,
        });

        const fullEnv = StackUtil.getFullEnv(stack);

        expect(fullEnv).toEqual(expected);
    }

    test('getFullEnv - aaa', () => {
        assertFullEnv("aaa", "road-unknown");
    });

    test('getFullEnv - marine prod', () => {
        assertFullEnv("marineSomethingProd", "marine-prod");
    });

    test('getFullEnv - marine test', () => {
        assertFullEnv("marineSomethingTest", "marine-test");
    });

    test('getFullEnv - road test', () => {
        assertFullEnv("roadSomethingTest", "road-test");
    });

    test('getFullEnv - something test', () => {
        assertFullEnv("somethingSomethingTest", "road-test");
    });

});