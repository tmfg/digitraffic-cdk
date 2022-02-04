import {mergeApiDescriptions} from "../lib/swagger-utils";

describe('swagger-utils', () => {

    test('mergeApiDescriptions', () => {
        const appApi = {paths: {'/app/path': {}}};
        const apiGwApi1 = {paths: {'/apigw1/path': {}}};
        const apiGwApi2 = {paths: {'/apigw2/path': {}}};

        expect(mergeApiDescriptions([appApi, apiGwApi1, apiGwApi2])).toMatchObject({
            paths: {
                '/app/path': {},
                '/apigw1/path': {},
                '/apigw2/path': {},
            },
        });
    });

});
