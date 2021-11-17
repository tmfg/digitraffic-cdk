import axios, {AxiosResponse} from 'axios';
import * as https from "https";
import util from "util";
import {parseString} from "xml2js";

import {Camera} from "../model/camera";
import {
    ChangeStreamCommand,
    CloseStreamCommand,
    Command,
    ConnectCommand,
    GetAllCamerasCommand, GetThumbnailByTimeCommand,
    GetThumbnailCommand,
    LoginCommand,
    RequestStreamCommand
} from "./command";

const COMPR_LEVEL = '70';
const DEST_WIDTH = '1280';
const DEST_HEIGHT = '720';

const COMMUNICATION_URL_PART = '/Communication';
const VIDEO_URL_PART = '/Video/';

const agent = new https.Agent({
  rejectUnauthorized: false
});

const parse = util.promisify(parseString);

export class Session {
    readonly communicationUrl: string;
    readonly videoUrl: string;
    readonly agent: https.Agent;

    // this increases for every command
    sequenceId: number;
    // this is received after successful connect and must be used in every command after that
    connectionId: string;

    constructor(url: string, acceptSelfSignedCertificate = false, certificate?: string) {
        this.communicationUrl = url + COMMUNICATION_URL_PART;
        this.videoUrl = url + VIDEO_URL_PART;
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

    async post(url: string, xml: string, configuration?: any): Promise<AxiosResponse<any>> {
        return axios.post(url, xml, {...configuration, ...{ httpsAgent: agent, timeout: 3000 }});
    }

    async sendMessage(command: Command): Promise<any> {
        const xml = command.createXml(this.sequenceId, this.connectionId);
        this.sequenceId++;

//        console.info("sending:" + xml);

        const resp = await this.post(this.communicationUrl, xml);

        if (resp.status !== 200) {
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

        return this.sendMessage(command);
    }

    async getAllViewsAndCameras(): Promise<Camera[]> {
        return this.sendMessage(new GetAllCamerasCommand());
    }

    async getThumbnail(cameraId: string): Promise<string> {
        const command = new GetThumbnailCommand()
            .addInputParameters('CameraId', cameraId)
            .addInputParameters('DestWidth', DEST_WIDTH)
            .addInputParameters('DestHeight', DEST_HEIGHT)
            .addInputParameters('ComprLevel', COMPR_LEVEL);

        return this.sendMessage(command);
    }

    async getThumbnailByTime(cameraId: string): Promise<string> {
        const command = new GetThumbnailByTimeCommand()
            .addInputParameters('CameraId', cameraId)
            .addInputParameters('Time', Date.now().toString())
            .addInputParameters('DestWidth', DEST_WIDTH)
            .addInputParameters('DestHeight', DEST_HEIGHT)
            .addInputParameters('ComprLevel', COMPR_LEVEL);

        return this.sendMessage(command);
    }

    async requestStream(cameraId: string): Promise<string> {
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
            .addInputParameters('Blocking', 'Yes')

        return this.sendMessage(command);
    }

    async setStreamTime(videoId: string): Promise<void> {
        const command = new ChangeStreamCommand()
            .addInputParameters('VideoId', videoId)
            .addInputParameters('Time', Date.now().toString());

        return this.sendMessage(command);
    }

    async setStreamSpeed(videoId: string): Promise<unknown> {
        const command = new ChangeStreamCommand()
            .addInputParameters('VideoId', videoId)
            .addInputParameters('Speed', '1.0');

        return this.sendMessage(command);
    }

    async getFrameFromStream(videoId: string): Promise<string|null> {
        const streamUrl = this.videoUrl + videoId;

        console.info("posting to " + streamUrl);

        const response = await this.post(streamUrl, '', {responseType: 'arraybuffer'});

        // format is uuid(16) timestamp(8) datasize(4) headersize(2) headerExtension(2)...
        const buffer = Buffer.from(response.data);
        const dataSize = buffer.readUInt32LE(16 + 8 + 4);
        const headerSize = buffer.readUInt16LE(16 + 8 + 4 + 4);

        // if no data, return empty
        if(dataSize === 0) {
            return null;
        }

        // else remove skip header and return jpeg base64-encoded
        return buffer.slice(headerSize).toString('base64');
    }

    async closeStream(videoId: string): Promise<void> {
        const command = new CloseStreamCommand()
            .addInputParameters('VideoId', videoId);

        return this.sendMessage(command);
    }
}
