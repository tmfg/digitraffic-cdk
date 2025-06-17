import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import util from "util";
import { parseString } from "xml2js";
import {
  ChangeStreamCommand,
  CloseStreamCommand,
  type Command,
  type CommandResponse,
  ConnectCommand,
  GetThumbnailByTimeCommand,
  GetThumbnailCommand,
  LoginCommand,
  LogoutCommand,
  RequestStreamCommand,
} from "./command.js";
import { Agent, type Dispatcher, interceptors, request } from "undici";

const COMPR_LEVEL = "70" as const;
const DEST_WIDTH = "1280" as const;
const DEST_HEIGHT = "720" as const;

const AXIOS_TIMEOUT_MILLIS = 2000 as const;

const COMMUNICATION_URL_PART = "/Communication";
const VIDEO_URL_PART = "/Video/";

const parse = util.promisify(parseString);

export class Session {
  readonly communicationUrl: string;
  readonly videoUrl: string;
  readonly dispatcher: Dispatcher;

  // this increases for every command
  sequenceId: number;
  // this is received after successful connect and must be used in every command after that
  connectionId: string | undefined = undefined;

  constructor(url: string, certificate: string, ca: string) {
    this.communicationUrl = url + COMMUNICATION_URL_PART;
    this.videoUrl = url + VIDEO_URL_PART;
    this.sequenceId = 1;

    const agent = new Agent({
      connect: {
        cert: Buffer.from(certificate, "base64").toString(),
        ca: Buffer.from(ca, "base64").toString(),
      },
      pipelining: 6,
    });

    this.dispatcher = agent.compose(interceptors.retry({
      methods: ["POST"],
      maxRetries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      timeoutFactor: 2,
      retryAfter: true,
    }));
  }

  async post(
    url: string,
    xml: string,
    configuration?: Partial<Dispatcher.RequestOptions>,
  ): Promise<Dispatcher.ResponseData> {
    try {
      return await request(url, {
        method: "POST",
        body: xml,
        headers: {
          host: "VideoOSLogServer",
          "accept": "application/json",
        },
        dispatcher: this.dispatcher,
        bodyTimeout: AXIOS_TIMEOUT_MILLIS,
        ...configuration,
      });
    } catch (e) {
      logger.error({
        method: "Session.post",
        error: e,
      });

      throw e;
    }
  }

  async sendMessage<T>(
    command: Command<T>,
    configuration?: Partial<Dispatcher.RequestOptions>,
  ): Promise<T> {
    const xml = command.createXml(this.sequenceId, this.connectionId);
    this.sequenceId++;

    //        logger.debug("sending:" + xml);

    const resp = await this.post(this.communicationUrl, xml, configuration);

    //        logger.debug("response " + JSON.stringify(resp));

    if (resp.statusCode !== 200) {
      throw Error("sendMessage failed " + JSON.stringify(resp));
    }

    // it's actually xml, so we have to take it as text and then parse it
    const body = await resp.body.text();

    const response = await parse(body) as CommandResponse;
    command.checkError(response);

    return command.getResult(response);
  }

  async connect(): Promise<string> {
    // longer timeout for connect
    this.connectionId = await this.sendMessage(new ConnectCommand(), {
      bodyTimeout: 4000,
    });

    return this.connectionId;
  }

  login(username: string, password: string): Promise<void> {
    const command = new LoginCommand()
      .addInputParameters("Username", username)
      .addInputParameters("Password", password);

    // use a bit longer timeout for login
    return this.sendMessage(command, { bodyTimeout: 8000 });
  }

  disconnect(): Promise<void> {
    const command = new LogoutCommand();

    return this.sendMessage(command);
  }

  getThumbnail(cameraId: string): Promise<string> {
    const command = new GetThumbnailCommand()
      .addInputParameters("CameraId", cameraId)
      .addInputParameters("DestWidth", DEST_WIDTH)
      .addInputParameters("DestHeight", DEST_HEIGHT)
      .addInputParameters("ComprLevel", COMPR_LEVEL);

    return this.sendMessage(command);
  }

  getThumbnailByTime(cameraId: string): Promise<string> {
    const command = new GetThumbnailByTimeCommand()
      .addInputParameters("CameraId", cameraId)
      .addInputParameters("Time", Date.now().toString())
      .addInputParameters("DestWidth", DEST_WIDTH)
      .addInputParameters("DestHeight", DEST_HEIGHT)
      .addInputParameters("ComprLevel", COMPR_LEVEL);

    return this.sendMessage(command);
  }

  requestStream(cameraId: string): Promise<string> {
    const command = new RequestStreamCommand()
      .addInputParameters("CameraId", cameraId)
      .addInputParameters("DestWidth", DEST_WIDTH)
      .addInputParameters("DestHeight", DEST_HEIGHT)
      .addInputParameters("SignalType", "Live")
      .addInputParameters("MethodType", "Pull")
      .addInputParameters("Fps", "1")
      .addInputParameters("ComprLevel", COMPR_LEVEL)
      .addInputParameters("KeyFramesOnly", "Yes")
      .addInputParameters("RequestSize", "Yes")
      .addInputParameters("StreamType", "Transcoded")
      .addInputParameters("ResizeAvailable", "Yes")
      .addInputParameters("Blocking", "Yes");

    return this.sendMessage(command);
  }

  setStreamTime(videoId: string): Promise<void> {
    const command = new ChangeStreamCommand()
      .addInputParameters("VideoId", videoId)
      .addInputParameters("Time", Date.now().toString());

    return this.sendMessage(command);
  }

  setStreamSpeed(videoId: string): Promise<unknown> {
    const command = new ChangeStreamCommand()
      .addInputParameters("VideoId", videoId)
      .addInputParameters("Speed", "1.0");

    return this.sendMessage(command);
  }

  async getFrameFromStream(videoId: string): Promise<string | undefined> {
    const streamUrl = this.videoUrl + videoId;

    logger.info({
      method: "SessionService.getFrameFromStream",
      message: "posting to " + streamUrl,
    });

    const response = await this.post(streamUrl, "");

    // format is uuid(16) timestamp(8) datasize(4) headersize(2) headerExtension(2)...
    const buffer = Buffer.from(await response.body.arrayBuffer());
    const dataSize = buffer.readUInt32LE(16 + 8 + 4);
    const headerSize = buffer.readUInt16LE(16 + 8 + 4 + 4);

    // if no data, return empty
    if (dataSize === 0) {
      return undefined;
    }

    // else remove skip header and return jpeg base64-encoded
    return buffer.subarray(headerSize).toString("base64");
  }

  closeStream(videoId: string): Promise<void> {
    const command = new CloseStreamCommand().addInputParameters(
      "VideoId",
      videoId,
    );

    return this.sendMessage(command);
  }
}
