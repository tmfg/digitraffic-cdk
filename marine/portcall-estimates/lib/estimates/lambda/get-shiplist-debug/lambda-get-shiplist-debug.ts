import {DbDebugShiplist, findByLocodeDebug} from '../../db/db-debug';
import {inDatabase} from 'digitraffic-lambda-postgres/database';
import {IDatabase} from 'pg-promise';
import moment from 'moment-timezone';

export const handler = async (
    event: any
): Promise<any> => {
    if (!event.queryStringParameters.locode) {
        return {statusCode: 400, body: 'Missing locode'};
    }
    return await inDatabase(async (db: IDatabase<any, any>) => {
        const shiplist: DbDebugShiplist[] = await findByLocodeDebug(db, event.queryStringParameters.locode);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html'
            },
            body: `
            <html>
                <head>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.min.css">
                </head>
                <body>
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Source</th>
                                <th>Time</th>
                                <th>Ship</th>
                            </tr>
                        </thead>
                        <tbody>${shiplist.reduce(toShiplistRow, '')}</tbody>
                    </table>
                </body>
            </html>
            `
        }
    });
};

function toShiplistRow(prevVal: string, e: DbDebugShiplist, idx: number): string {
    let currentDate = new Date();
    const eventTime = moment(e.event_time).tz('Europe/Helsinki') as moment.Moment;
    let timestring = eventTime.format("HH:mm");
    if (!isSameDate(currentDate, e.event_time)) {
        timestring = eventTime.format("D.MM HH:mm")
    }
    return prevVal + `<tr><td>${e.event_type}</td><td>${e.event_source}</td><td>${timestring}</td><td>${e.ship_name}</td></tr>`;
}


function isSameDate(date1: Date, date2: Date): boolean {
    return moment(date1).format("D.MM") === moment(date2).format("D.MM");
}
