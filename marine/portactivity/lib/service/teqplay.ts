import * as TeqplayAPI from "../api/teqplay";
import {Event} from "../model/teqplay-event";
import {ApiTimestamp, EventType, Ship} from "../model/timestamp";

const VALID_EVENT_TYPES = ['berth.eta.vessel'];

const CHANNEL_NAME = 'fintraffic';

export async function getMessagesFromTeqplay(): Promise<ApiTimestamp[]> {
    const events = await TeqplayAPI.getMessages(process.env.TEQPLAY_URL as string, CHANNEL_NAME);

    return events
        .filter(isValid)
        .map(convertToApiTimestamp);
}

function isValid(event: Event): boolean {
    return true; // for now
    //return VALID_EVENT_TYPES.includes(event.eventType.toLowerCase());
}

function convertToApiTimestamp(event: Event): ApiTimestamp {
    const ship = convertShip(event);
    const portcallId = convertPortcallId(event);
    const eventType = convertEventType(event);

    return {
        eventType: eventType,
        eventTime: event.eventTime,
        recordTime: event.recordTime,
        source: 'TEQPLAY',
        ship: ship,
        location: {
            port: 'FIHEL',
            berth: 'VUOS'
        },
        portcallId: portcallId
    };
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

function convertEventType(event: Event): EventType {
    // eventype is in form action.eventtype.source
    const eventtype = event.eventType.split('.')[1].toUpperCase();

    return EventType[eventtype as keyof typeof EventType];
}