import axios from 'axios';
import * as https from "https";
import util from "util";
import {parseString} from "xml2js";

import {Camera} from "../model/camera";
import {
    CloseStreamCommand,
    Command,
    ConnectCommand,
    GetAllCamerasCommand,
    GetThumbnailCommand,
    LoginCommand,
    RequestStreamCommand
} from "./command";

const COMPR_LEVEL = '70';
const DEST_WIDTH = '1280';
const DEST_HEIGHT = '720';

const agent = new https.Agent({
  rejectUnauthorized: false
});

const parse = util.promisify(parseString);

export class Session {
    readonly url: string;
    readonly agent: https.Agent;

    // this increases for every command
    sequenceId: number;
    // this is received after successful connect and must be used in every command after that
    connectionId: string;

    constructor(url: string, acceptSelfSignedCertificate: boolean = false, certificate?: string) {
        this.url = url;
        this.sequenceId = 1;

        if(acceptSelfSignedCertificate) {
            this.agent = new https.Agent({
                rejectUnauthorized: false
            });
        } else {
            if(!certificate) {
                throw new Error("No certificate!");
            }

            this.agent = new https.Agent({
                rejectUnauthorized: false,
                cert: certificate
            });
        }
    }

    async post(url: string, xml: string): Promise<any> {
        return await axios.post(this.url, xml, { httpsAgent: agent, timeout: 3000 });
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

//        console.info("response " + JSON.stringify(response, null, 2));

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
            .addInputParameters('Time', Date.now().toString())
            .addInputParameters('DestWidth', DEST_WIDTH)
            .addInputParameters('DestHeight', DEST_HEIGHT)
            .addInputParameters('ComprLevel', COMPR_LEVEL);

        return await this.sendMessage(command);
    }

    async startStream(cameraId: string) {
        const command = new RequestStreamCommand()
            .addInputParameters('CameraId', cameraId)
            .addInputParameters('DestWidth', DEST_WIDTH)
            .addInputParameters('DestHeight', DEST_HEIGHT)
            .addInputParameters('SignalType', 'Live')
            .addInputParameters('MethodType', 'Pull')
            .addInputParameters('Fps', '1')
            .addInputParameters('ComprLevel', COMPR_LEVEL)
            .addInputParameters('KeyFramesOnly', 'Yes')
            .addInputParameters('RequestSize', 'Yes')
            .addInputParameters('StreamType', 'Transcoded')
            .addInputParameters('ResizeAvailable', 'Yes')

        return await this.sendMessage(command);
    }

    async closeStream(videoId: string) {
        const command = new CloseStreamCommand()
            .addInputParameters('VideoId', videoId);

        return await this.sendMessage(command);
    }
}