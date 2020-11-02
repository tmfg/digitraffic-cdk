import {ITask} from "pg-promise";

import * as ShiplistDB from "../db/db-shiplist";
import {ShiplistEstimate} from "../db/db-shiplist";
import {getStartTimeForShiplist} from "../timeutil";
import {inTransaction} from "../../../../../common/postgres/database";
import {getDisplayableNameForEventSource} from "../event-sourceutil";

const moment = require('moment-timezone');

const shiplistUrl = process.env.SHIPLIST_URL as string

export async function getEstimates(time: string, locode: string): Promise<ShiplistEstimate[]> {
    const start = Date.now();
    const startTime = getStartTimeForShiplist(time);
    
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1);

    return await inTransaction(async (t: ITask<any>) => {
        return await ShiplistDB.findByLocode(t, startTime, endTime, locode);
    }).finally(() => {
        console.info("method=getShiplist tookMs=%d", (Date.now() - start));
    })
}

export function convertToSms(locode: string, estimates: ShiplistEstimate[]): string {
    let currentDate = new Date();

    const shiplist = estimates.length == 0 ? 'No estimates' : estimates.map(e => {
        let timestring = moment(e.event_time).tz('Europe/Helsinki').format("HH:mm");

        if(!isSameDate(currentDate, e.event_time)) {
            currentDate = e.event_time;

            timestring = moment(e.event_time).tz('Europe/Helsinki').format("D.MM HH:mm");
        }

        return `${e.event_type} ${getDisplayableNameForEventSource(e.event_source)} ${timestring} ${e.ship_name}`; }
    ).join('\n');

    return `Shiplist ${moment().format("DD.MM")} ${locode}:\n${shiplist}\n${shiplistUrl}${locode}`;
}

function isSameDate(date1: Date, date2: Date): boolean {
    return moment(date1).format("D.MM") === moment(date2).format("D.MM");
}
