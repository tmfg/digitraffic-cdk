import axios from 'axios';
import * as https from "https";
import util from "util";
import {parseString} from "xml2js";

import {Camera} from "../model/camera";
import {Command, ConnectCommand, GetAllCamerasCommand, GetThumbnailCommand, LoginCommand} from "./command";

const agent = new https.Agent({
  rejectUnauthorized: false
});

const parse = util.promisify(parseString);

export class Session {
    url: string;

    sequenceId: number;
    connectionId: string;

    constructor(url: string) {
        this.url = url;
        this.sequenceId = 1;
    }

    async sendMessage(command: Command) {
        command.setConnectionId(this.connectionId);
        const xml = command.createXml(this.sequenceId);

//        console.info("sending:" + xml);

        const resp = await axios.post(this.url, xml, { httpsAgent: agent })
            .catch(e => {
                throw new Error('posting failed with ' + e);
            });

        if (resp.status != 200) {
            throw Error("sendMessage failed " + JSON.stringify(resp));
        }

        const response = await parse(resp.data) as any;
        command.checkError(response);

        //console.info("response " + JSON.stringify(response, null, 2));

        return command.getResult(response);
    }

    async connect(): Promise<string> {
        this.connectionId = await this.sendMessage(new ConnectCommand());

        return this.connectionId;
    }

    async login(username: string, password: string): Promise<any> {
        const command = new LoginCommand()
            .addInputParameters('Username', username)
            .addInputParameters('Password', password);

        return await this.sendMessage(command);
    }

    async getAllViewsAndCameras(): Promise<Camera[]> {
        return await this.sendMessage(new GetAllCamerasCommand());
    }

    async getThumbnail(cameraId: string): Promise<string> {
        const command = new GetThumbnailCommand()
            .addInputParameters('CameraId', cameraId)
            .addInputParameters('DestWidth', '1024')
            .addInputParameters('DestHeight', '768')
            .addInputParameters('ComprLevel', '80');

        return await this.sendMessage(command);
    }
}