import * as pgPromise from "pg-promise";
import {handler} from '../../../../lib/lambda/update-subjects/lambda-update-subjects';
import {dbTestBase} from "../../db-testutil";
import {TestHttpServer} from "../../../../../../common/test/httpserver";
import {findAll} from "../../../../lib/db/db-subjects";

const SERVER_PORT = 8088;

process.env.ENDPOINT_USER = "some_user";
process.env.ENDPOINT_PASS = "some_pass";
process.env.ENDPOINT_URL = `http://localhost:${SERVER_PORT}`;

describe('update-subjects', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('update', async () => {
        const server = new TestHttpServer();
        server.listen(SERVER_PORT, {
            "/subjects": () => {
                return fakeSubjects();
            }
        });

        try {
            await handler();
            expect((await findAll(db)).map(s => Number(s.id))).toMatchObject([1,2,3,4,5,6,7,8,9,10,11,12]);
        } finally {
            server.close();
        }
    });

}));

function fakeSubjects() {
    return `
<?xml version="1.0" encoding="UTF-8"?>
<subjects>
    <subject>
        <active>1</active>
        <name>Obstacle on the road / Obstruction to view on the road (e.g. fallen trees, water has risen on the road)</name>
        <id>5</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Notification of fault (e.g. lighting, display devise, rail or bus stop)</name>
        <id>6</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Condition of paved road (e.g. paving damage, need for brushing)</name>
        <id>2</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Pedestrian and cycling routes (e.g. winter maintenance, pavement damage)</name>
        <id>8</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Winter road maintenance (e.g. slippery, unploughed, slush-covered)</name>
        <id>4</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Mowing and clearing coppices</name>
        <id>11</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Waterways</name>
        <id>10</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Cleanliness</name>
        <id>7</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Condition of the gravel road (e.g. frost damage, potholes in gravel road)</name>
        <id>3</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Railway network (station platforms, passenger information, track use, safety)</name>
        <id>9</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Vehicles left on roads (notifications and inquiries)</name>
        <id>12</id>
        <locale>en</locale>
    </subject>
    <subject>
        <active>1</active>
        <name>Feedback and development suggestions</name>
        <id>1</id>
        <locale>en</locale>
    </subject>
</subjects>
`;
}