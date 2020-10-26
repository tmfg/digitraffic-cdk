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
        const shiplist: DbDebugShiplist[] = await findByLocodeDebug(db, (event.queryStringParameters.locode as string).toUpperCase());
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html'
            },
            body: `
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
                </head>
                <body>
                    <div class="container">
                        <table class="table">
                            <thead>
                                <tr class="row">
                                    <th class="col-2">Type</th>
                                    <th class="col-4">Ship</th>
                                    <th class="col-3">Time</th>
                                    <th class="col-3">Source</th>
                                </tr>
                            </thead>
                            <tbody>${shiplist.reduce(toShiplistRow, '')}</tbody>
                        </table>
                    </div>
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

    const source = e.event_source == 'Portnet' ? 'PNET' : e.event_source;
    const hoursAgo = Math.ceil((moment().valueOf() - moment(e.record_time).valueOf()) / 1000 / 60 / 60);
    const sourceHoursAgo = `${source} (${hoursAgo} h)`;

    return prevVal + `
        <tr class="row">
            <td class="col-2">${e.event_type}</td>
            <td class="col-4">${e.ship_name}</td>
            <td class="col-3">${timestring}</td>
            <td class="col-3">${sourceHoursAgo}</td>
        </tr>`;
}


function isSameDate(date1: Date, date2: Date): boolean {
    return moment(date1).format("D.MM") === moment(date2).format("D.MM");
}
