import {Event} from "../../../../road/maintenance-tracking/lib/model/teqplay-event";

const amqplib = require("amqplib");

export async function getMessages(uri: string, channelName: string): Promise<Event[]> {
    const connection = await amqplib.connect(uri);

    let events = [] as Event[];
    let message;

    try {
        const channel = await connection.createChannel();

        do {
            message = await channel.get(channelName);

            const buffer = Buffer.from(message.content);
            const event = JSON.parse(buffer.toString());

            events.push(event);

            //channel.ack(message); not yet
//        } while (message != null);
        } while (false); // not there yet

        return events;
    } finally {
        connection.close();
    }
}