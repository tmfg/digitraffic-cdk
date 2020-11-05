import {ITask} from "pg-promise";

import * as ShiplistDB from "../db/db-shiplist";
import {ShiplistEstimate} from "../db/db-shiplist";
import {getStartTimeForShiplist} from "../timeutil";
import {inTransaction} from "../../../../../common/postgres/database";
import {getDisplayableNameForEventSource, selectBetterEstimate} from "../event-sourceutil";

const moment = require('moment-timezone');

const shiplistUrl = process.env.SHIPLIST_URL as string

export async function getEstimates(time: string, locode: string): Promise<ShiplistEstimate[]> {
    const start = Date.now();
    const startTime = getStartTimeForShiplist(time);
    
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1);

    return await inTransaction(async (t: ITask<any>) => {
        return await ShiplistDB.findByLocode(t, startTime, endTime, locode).then(selectBestEstimates)
    }).finally(() => {
        console.info("method=getShiplist tookMs=%d", (Date.now() - start));
    })
}

function selectBestEstimates(estimates: ShiplistEstimate[]): ShiplistEstimate[] {
    const bestEstimates: ShiplistEstimate[] = [];
    let previousEstimate: ShiplistEstimate;

    estimates.forEach(e => {
        console.info("handling estimate %s for %s", e.event_source, e.ship_name)

        // a new portcall
        if(previousEstimate?.coalesce_id != e.coalesce_id) {
            // and not the first one, push to list
            if (previousEstimate) {
                console.info("pushing %s %s", previousEstimate.event_source, e.ship_name);

                bestEstimates.push(previousEstimate);
            }

            previousEstimate = e;
        } else {
            // portcall is not changing, so we check if it's better than the previous estimate
            previousEstimate = selectBetterEstimate(previousEstimate, e);
        }
    });

    // @ts-ignore
    bestEstimates.push(previousEstimate);

    return bestEstimates;
}

export function convertToSms(locode: string, estimates: ShiplistEstimate[]): string {
    let currentDate = new Date();

    const shiplist = estimates.length == 0 ? 'No estimates' : estimates.map(e => {
        let timestring = moment(e.event_time).tz('Europe/Helsinki').format("HH:mm");

        if(!isSameDate(currentDate, e.event_time)) {
            currentDate = e.event_time;

            timestring = moment(e.event_time).tz('Europe/Helsinki').format("D.MM HH:mm");
        }

        return `${e.ship_name} ${e.event_type} ${timestring} ${getDisplayableNameForEventSource(e.event_source)}`; }
    ).join('\n');

    return `Shiplist ${moment().format("DD.MM")} ${locode}:\n${shiplist}\nTo unsubscribe reply REMOVE ${locode}.\nFor more information: ${shiplistUrl}${locode}`;
}

function isSameDate(date1: Date, date2: Date): boolean {
    return moment(date1).format("D.MM") === moment(date2).format("D.MM");
}
