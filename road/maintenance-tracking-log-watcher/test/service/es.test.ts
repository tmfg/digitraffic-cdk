import {readFileSync} from 'fs';
import {parseDataToString, getQuery} from "../../lib/service/es";
import moment from 'moment-timezone';

describe('maintenance-tracking-log-watch-es', () => {

    test('parseDataToString - 2 hits', async () => {
        const esQueryResultJsonString = readFile('esQueryResult.json')
        const resultJsonObj = JSON.parse(esQueryResultJsonString);
        const resultLog = parseDataToString(resultJsonObj);
        const expected =
`method=resolveGeometries 1

method=resolveGeometries 2`;
        expect(resultLog).toEqual(expected);
    });

    test('parseDataToString - no hits', async () => {
        const esQueryResultJsonString = readFile('esQueryResultNoHits.json')
        const resultJsonObj = JSON.parse(esQueryResultJsonString);
        const resultLog = parseDataToString(resultJsonObj);
        const expected = "";
        expect(resultLog).toEqual(expected);
    });

    test('getQuery', async () => {
        const fromISOString = moment().subtract(1, 'weeks').startOf('isoWeek').toDate().toISOString();
        const toISOString = moment().subtract(1, 'weeks').endOf('isoWeek').toDate().toISOString();
        const queryJsonStr = getQuery(fromISOString, toISOString);
        const queryJsonObj = JSON.parse(queryJsonStr);
        const range = queryJsonObj.query.bool.filter[0].range;
        expect(range['@timestamp'].gte).toEqual(fromISOString);
        expect(range['@timestamp'].lte).toEqual(toISOString);
    });
});

function readFile(filename: string) : string {
    return readFileSync('test/service/' + filename, 'utf8');
}