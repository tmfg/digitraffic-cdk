import {Event} from "../../../../road/maintenance-tracking/lib/model/teqplay-event";

export async function getMessages(): Promise<Event[]> {
    const connection = await require('amqplib')
        .connect('connectionstring');

    let messages = [] as Event[];

    try {
        const channel = await connection.createChannel();
        const message = await channel.get("fintraffic");

        const buffer = Buffer.from(message.content);
        const event = JSON.parse(buffer.toString());
        messages.push(event);
        console.info(event);

        return messages;
    } finally {
        connection.close();
    }
}

