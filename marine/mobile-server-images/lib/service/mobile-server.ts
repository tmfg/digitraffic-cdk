import axios from 'axios';
import * as https from "https";
import {Camera} from "../model/camera";
import util from "util";
import {parseString} from "xml2js";
import {Command, ConnectCommand, GetAllCamerasCommand, GetThumbnailCommand, LoginCommand} from "./command";

const agent = new https.Agent({
  rejectUnauthorized: false
});

const FIELD_COMMUNICATION = "Communication";
const FIELD_COMMAND = "Command"

const parse = util.promisify(parseString);

export class Session {
    url: string;
    username: string;
    password: string;

    sequenceId: number;
    connectionId: string;

    constructor(url: string, username: string, password: string) {
        this.url = url;
        this.username = username;
        this.password = password;
        this.sequenceId = 1;
    }

    async sendMessage(command: Command) {
        command.setConnectionId(this.connectionId);
        const xml = command.createXml(this.sequenceId);

//        console.info("sending:" + xml);

        const resp = await axios.post(this.url, xml, { httpsAgent: agent });

        if (resp.status != 200) {
            throw Error("sendMessage failed " + JSON.stringify(resp));
        }

//        console.info("response " + resp.data);

        const response = await parse(resp.data) as any;

        if(response[FIELD_COMMUNICATION][FIELD_COMMAND].Result == 'Error') {
            throw new Error("failed with errorcode!")
        }

        return command.getResult(response);
    }

    async connect(): Promise<string> {
        this.connectionId = await this.sendMessage(new ConnectCommand());

        return this.connectionId;
    }

    async login() {
        const command = new LoginCommand()
            .addInputParameters('Username', this.username)
            .addInputParameters('Password', this.password);

        await this.sendMessage(command);
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

/*
function reverseBuffer(buffer: Buffer): Buffer {
    const newBuffer = Buffer.alloc(buffer.length);

    for(let j=0, i = buffer.length - 1;i >= 0;i--) {
        newBuffer.writeInt8(buffer.readInt8(i), j++);
    }

    //return buffer;
    return newBuffer;
}*/

/*
function createSharedSecret(dh: DiffieHellman, otherPublic: string): string {
    console.info(`other key ${otherPublic} size ${otherPublic.length}`);

    const otherBuffer = Buffer.from(otherPublic, BASE64);
    const reversedBuffer = reverseBuffer(otherBuffer);

    console.info(`reversed key ${reversedBuffer.toString(BASE64)} size ${reversedBuffer.length}`);

    // the protocol might add extra zero at the end, so remove it
    if(reversedBuffer.length == 129) {
        const newBuffer = reversedBuffer.slice(0, 128);

        console.info("newbuffer length " + newBuffer.length);

        return dh.computeSecret(newBuffer.toString(BASE64), BASE64, HEX);
    }

    if(reversedBuffer.length != 128) {
        throw new Error("Got key with invalid length " + reversedBuffer.length);
    }

    return dh.computeSecret(reversedBuffer.toString(BASE64), BASE64, HEX);
}*/

//function generatePublicKey(): Buffer {
//    const key = new bigInt(COMMON_GENERATOR, 16).modPow(new bigInt(12345), new bigInt(COMMON_KEY, 16));

//    console.info("key " + key);
//    return Buffer.from(key.toString(64, 'ABCDEFGHIJKLMNOPQRTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'));
//}
