import {getMessages} from "../api/pilotweb";

export interface PilotageData {
    readonly imo: number,
    readonly locode: string,
    readonly berth: string,
    readonly timestamp: Date,
    readonly endTime: Date
}

export async function getMessagesFromPilotweb(host: string, token: string): Promise<PilotageData[]> {
    const message = await getMessages(host, token);
    const pilotages = JSON.parse(message).pilotages;

    console.log("method=PortActivity.GetMessages source=Pilotweb receivedCount=%d", pilotages.length);

    return pilotages.map(convert);
}

function convert(pilotage: any): PilotageData {
    return {
        imo: pilotage.vessel1.imo,
        locode: pilotage.end.code,
        berth: pilotage.end.berth,
        timestamp: pilotage.infoTime,
        endTime: pilotage.pilotageEndTime
    }
}