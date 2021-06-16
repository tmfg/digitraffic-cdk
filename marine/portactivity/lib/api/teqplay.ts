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

                console.info(JSON.stringify(event));

                events.push(event);
                channel.ack(message);
            }
        } while (message);
        return events;
    } finally {
        console.info("method=PortActivity.GetMessages receivedCount=%d source=Teqplay", events.length);

        await connection.close();
    }
}
