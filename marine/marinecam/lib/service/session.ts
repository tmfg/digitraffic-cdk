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
    readonly url: string;
    readonly acceptSelfSignedCertificate: boolean;

    // this increases for every command
    sequenceId: number;
    // this is received after succesful connect and must be used in every command after that
    connectionId: string;

    constructor(url: string, acceptSelfSignedCertificate: boolean = false) {
        this.url = url;
        this.sequenceId = 1;
        this.acceptSelfSignedCertificate = acceptSelfSignedCertificate;
    }

    async post(url: string, xml: string): Promise<any> {
        if(this.acceptSelfSignedCertificate) {
            return await axios.post(this.url, xml, { httpsAgent: agent });
        }

        return await axios.post(this.url, xml);
    }

    async sendMessage(command: Command) {
        const xml = command.createXml(this.sequenceId++, this.connectionId);

//        console.info("sending:" + xml);

        const resp = await this.post(this.url, xml);

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