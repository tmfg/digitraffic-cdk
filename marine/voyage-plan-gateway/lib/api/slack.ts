import axios from "axios";

export class SlackApi {

    private readonly url: string;

    constructor(url :string) {
        this.url = url;
    }

    async notify(text: string) {
        try {
            console.info('method=notify Notifying Slack')
            await axios.post(this.url, {
                text
            });
        } catch (error) {
            console.error('method=notify Slack notify failed!');
        }
    }

}
