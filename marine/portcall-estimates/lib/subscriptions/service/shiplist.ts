import * as ShiplistDB from "../db/db-shiplist";
import {ShiplistEstimate} from "../db/db-shiplist";
import {inDatabase} from "../../../../../common/postgres/database";
import {IDatabase} from "pg-promise";

import moment from "moment";

export async function getShiplist(locode: string): Promise<string> {
    const start = Date.now();

    return await inDatabase(async (db: IDatabase<any, any>) => {
        const date = new Date();
        return await ShiplistDB.findByLocode(db, locode).then((estimates) => {
            return convertToSms(moment(date).format("D.MM"), locode, estimates);
        });
    }).finally(() => {
        console.info("method=getShiplist tookMs=%d", (Date.now() - start));
    })
}

function convertToSms(date: string, locode: string, estimates: ShiplistEstimate[]): string {
    let currentDate = new Date();

    const shiplist = estimates.map(e => {
        let timestring = moment(e.event_time).format("HH:mm");

        if(!isSameDate(currentDate, e.event_time)) {
            currentDate = e.event_time;

            timestring = moment(e.event_time).format("D.MM HH:mm")
        }

        return `${e.event_type} ${e.event_source} ${timestring} ${e.ship_name}`; }
    ).join('\n');

    return `Laivalista ${date} ${locode}:\n${shiplist}`;
}

function isSameDate(date1: Date, date2: Date): boolean {
    return moment(date1).format("D.MM") === moment(date2).format("D.MM");
}
