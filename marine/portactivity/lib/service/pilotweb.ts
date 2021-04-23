import {getMessages} from "../api/pilotweb";
import {ApiTimestamp, EventType} from "../model/timestamp";

export async function getMessagesFromPilotweb(host: string, authHeader: string): Promise<ApiTimestamp[]> {
    const message = await getMessages(host, authHeader);

    const pilotages = JSON.parse(message);

    console.log("method=PortActivity.GetMessages source=Pilotweb receivedCount=%d", pilotages.length);

    //console.log("message " + JSON.stringify(message));

    return pilotages.map(convert);
}

function convert(pilotage: any): ApiTimestamp {
    const eventType = getEventType(pilotage);
    const eventTime = getEventTime(pilotage);

    return {
        eventType,
        eventTime,
        recordTime: new Date().toISOString(), // TODO: this will be pilotage.scheduleUpdated
        source: 'PILOTWEB',
        ship: {
            mmsi: pilotage.vessel.mmsi,
            imo: pilotage.vessel.imo
        },
        location: {
            port: pilotage.route.end.code,
            berth: pilotage.route.end.berth?.code,
        }
    }
}

function getEventType(pilotage: any): EventType {
    return pilotage.state == 'FINISHED' ? EventType.ATA : EventType.ETA;
}

function getEventTime(pilotage: any): string {
    if(pilotage.eventBoardingTime) {
        const etAsDate = new Date(pilotage.endTime);
        const ebtAsDate = new Date(pilotage.eventBoardingTime);

        if(ebtAsDate > etAsDate) return pilotage.eventBoardingTime;
    }

    return pilotage.endTime;
}