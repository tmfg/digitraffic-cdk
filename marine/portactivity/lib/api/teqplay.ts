import {Event} from "../model/teqplay-event";
import {connect} from 'amqplib';

export async function getMessages(uri: string, channelName: string): Promise<Event[]> {
    const connection = await connect(uri);

    const events = [] as Event[];
    let message;

    try {
        const channel = await connection.createChannel();

        do {
            message = await channel.get(channelName);

            if(message) {
                const buffer = Buffer.from(message.content);
                const event = JSON.parse(buffer.toString());

                events.push(event);
            }

            //channel.ack(message); not yet
//        } while (message != null);
        } while (false); // not there yet

        return events;
    } finally {
        await connection.close();
    }
}