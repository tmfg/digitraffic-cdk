import * as TeqplayAPI from "../api/teqplay";
import {Event} from "../model/teqplay-event";
import {ApiTimestamp, EventType, Ship} from "../model/timestamp";
import {EventSource} from "../model/eventsource";

const VALID_EVENT_TYPES = ['berth.eta.vessel'];

const CHANNEL_NAME = 'fintraffic';

export async function getMessagesFromTeqplay(queueUrl: string): Promise<ApiTimestamp[]> {
    const events = await TeqplayAPI.getMessages(queueUrl, CHANNEL_NAME);

    return events
        .filter(isValid)
        .map(convertToApiTimestamp);
}

function isValid(event: Event): boolean {
    return VALID_EVENT_TYPES.includes(event.eventType.toLowerCase());
}

function convertToApiTimestamp(event: Event): ApiTimestamp {
    const ship = convertShip(event);
    const portcallId = convertPortcallId(event);
    const eventType = convertEventType(event);

    return {
        eventType: eventType,
        eventTime: event.eventTime,
        recordTime: event.recordTime,
        source: EventSource.TEQPLAY,
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

    if(event.ship.imo) {
        ship.imo = +event.ship.imo;
    }
    if(event.ship.mmsi) {
        ship.mmsi = +event.ship.mmsi;
    }

    return ship;
}

function convertPortcallId(event: Event): number|null {
    return event.portcallId? +event.portcallId : null;
}

function convertEventType(event: Event): EventType {
    // eventype is in form action.eventtype.source
    const eventtype = event.eventType.split('.')[1].toUpperCase();

    return EventType[eventtype as keyof typeof EventType];
}