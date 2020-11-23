import {ITask} from "pg-promise";

import * as ShiplistDB from "../db/db-shiplist";
import {ShiplistEstimate} from "../db/db-shiplist";
import {getStartTimeForShiplist} from "../timeutil";
import {inTransaction} from "../../../../../common/postgres/database";
import {getDisplayableNameForEventSource, selectBetterEstimate} from "../../event-sourceutil";

const moment = require('moment-timezone');

const shiplistUrl = process.env.SHIPLIST_URL as string

export async function getEstimates(time: string, locode: string): Promise<ShiplistEstimate[]> {
    const start = Date.now();
    const startTime = getStartTimeForShiplist(time);
    
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1);

    return await inTransaction(async (t: ITask<any>) => {
        const estimates = await ShiplistDB.getShiplistForLocode(t, startTime, endTime, locode)
            .then(selectBestEstimates);

        return orderAndFilter(estimates, startTime, endTime);
    }).finally(() => {
        console.info("method=getShiplist tookMs=%d", (Date.now() - start));
    })
}

function orderAndFilter(estimates: ShiplistEstimate[], startTime: Date, endTime: Date): ShiplistEstimate[] {
    return estimates
        .filter(e => e.event_time.getTime() >= startTime.getTime() && e.event_time.getTime() <= endTime.getTime())
        .sort((a, b) => a.event_time.getTime() - b.event_time.getTime());
}

function selectBestEstimates(estimates: ShiplistEstimate[]): ShiplistEstimate[] {
    const bestEstimates: ShiplistEstimate[] = [];
    let previousEstimate: ShiplistEstimate;

    /*
        ShiplistDB returns all estimates for all events. But, we want to show only the best estimate for each portcall+event type.  So,
        we have to iterate through and select the best ones.  Estimates returned from the db are sorted by (portcall_id, event_type) so
        we can check when those change, we know a new set of estimates to choose from begins.

        previousEstimate holds currently best estimate for the set.  selectBetterEstimate compares the current estimate to previousEstimate and
        eventually we end up with the best estimate.
     */

    estimates.forEach(e => {
        console.info("handling estimate %s for %s %s", e.event_source, e.portcall_id, e.event_type);
        console.info("and previous is %s for %s %s", previousEstimate?.event_source, previousEstimate?.portcall_id, previousEstimate?.event_type);

        // a new portcall + eventtype
        if(previousEstimate?.portcall_id != e.portcall_id || previousEstimate?.event_type != e.event_type) {
            console.info("a new portcall event!");

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
        let dateChange = '';

        if(!isSameDate(currentDate, e.event_time)) {
            currentDate = e.event_time;

            dateChange = moment(e.event_time).tz('Europe/Helsinki').format("DD.MM") + ":\n";
        }

        return `${dateChange}${e.ship_name} ${e.event_type} ${timestring} ${getDisplayableNameForEventSource(e.event_source)}`; }
    ).join('\n');

    return `Shiplist ${moment().format("DD.MM")} ${locode}:\n${shiplist}\nTo unsubscribe reply REMOVE ${locode}.\nFor more information: ${shiplistUrl}${locode}`;
}

function isSameDate(date1: Date, date2: Date): boolean {
    return moment(date1).format("D.MM") === moment(date2).format("D.MM");
}
