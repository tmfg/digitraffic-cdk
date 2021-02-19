import {Event} from "../../../../road/maintenance-tracking/lib/model/teqplay-event";
import {ApiTimestamp, EventType, Ship} from "../model/timestamp";

const amqplib = require("amqplib");

const AMQP_URI = 'uri';
const CHANNEL_NAME = 'fintraffic';

export async function getMessages(): Promise<ApiTimestamp[]> {
    const connection = await amqplib.connect(AMQP_URI);

    let messages = [] as Event[];

    try {
        const channel = await connection.createChannel();
        const message = await channel.get(CHANNEL_NAME);

        const buffer = Buffer.from(message.content);
        const event = JSON.parse(buffer.toString());
        messages.push(event);
        console.info(event);

        return convertToApiTimestamp(messages);
    } finally {
        connection.close();
    }
}

function convertToApiTimestamp(events: Event[]): ApiTimestamp[] {
    return events
//        .filter(isValid)
        .map(event => {
            const ship = convertShip(event);
            const portcallId = convertPortcallId(event);

            return {
                eventType: EventType.ETA,
                eventTime: event.eventTime,
                recordTime: event.recordTime,
                source: 'TEQPLAY',
                ship: ship,
                location: {
                    port: 'FIHEL',
                    berth: 'VUOS'
                },
                portcallId: portcallId
            }
    });
}

function isValid(event: Event): boolean {
    return event.eventType.toLowerCase() === 'berth.eta.vessel';
}

function convertShip(event: Event): Ship {
    const ship = {} as any;

    if(event.ship.imo) ship.imo = +event.ship.imo;
    if(event.ship.mmsi) ship.mmsi = +event.ship.mmsi;

    return ship;
}

function convertPortcallId(event: Event): number|null {
    if(event.portcallId) return +event.portcallId.substring(5);
    return null;
}

