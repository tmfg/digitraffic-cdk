import type { DiffieHellman } from "node:crypto";
import { createCipheriv, createDiffieHellman } from "node:crypto";
import util from "node:util";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { Dispatcher } from "undici";
import { Agent, interceptors, request } from "undici";
import { parseString } from "xml2js";
import type { Command, CommandResponse } from "./command.js";
import {
  ChangeStreamCommand,
  CloseStreamCommand,
  ConnectCommand,
  GetThumbnailByTimeCommand,
  GetThumbnailCommand,
  LoginCommand,
  LogoutCommand,
  RequestStreamCommand,
} from "./command.js";

const COMPR_LEVEL = "70" as const;
const DEST_WIDTH = "1280" as const;
const DEST_HEIGHT = "720" as const;

const REQUEST_TIMEOUT_MILLIS = 2000 as const;

const COMMUNICATION_URL_PART = "/Communication";
const VIDEO_URL_PART = "/Video/";

const MOBILE_SERVER_PUBLIC_KEY =
  "F488FD584E49DBCD20B49DE49107366B336C380D451D0F7C88B31C7C5B2D8EF6F3C923C043F0A55B188D8EBB558CB85D38D334FD7C175743A31D186CDE33212CB52AFF3CE1B1294018118D7C84A70A72D686C40319C807297ACA950CD9969FABD00A509B0246D3083D66A45D419F9C7CBD894B221926BAABA25EC355E92F78C7" as const;
const MOBILE_SERVER_GENERATOR = "02" as const;

const parse = util.promisify(parseString);

// Node's DiffieHellman strips leading zero bytes, so keys/secrets can be shorter than the modulus
function padLeft(buffer: Buffer, length: number): Buffer {
  if (buffer.length >= length) {
    return buffer;
  }

  return Buffer.concat([Buffer.alloc(length - buffer.length), buffer]);
}

// Node represents DH keys/secrets big-endian; the Milestone wire protocol uses little-endian,
// with a trailing zero byte appended when the most significant byte would otherwise be read as negative
function toLittleEndianWireFormat(
  bigEndian: Buffer,
  keyLength: number,
): Buffer {
  const littleEndian = padLeft(bigEndian, keyLength).reverse();

  return (littleEndian[littleEndian.length - 1] ?? 0) >= 0x80
    ? Buffer.concat([littleEndian, Buffer.alloc(1)])
    : littleEndian;
}

function fromLittleEndianWireFormat(littleEndian: Buffer): Buffer {
  return Buffer.from(littleEndian).reverse();
}

export class Session {
  readonly communicationUrl: string;
  readonly videoUrl: string;
  readonly dispatcher: Dispatcher;
  readonly hostname: string;

  readonly dh: DiffieHellman;
  readonly publicKey: Buffer;

  serverPublicKey: Buffer | undefined = undefined;

  // this increases for every command
  sequenceId: number;
  // this is received after successful connect and must be used in every command after that
  connectionId: string | undefined = undefined;

  constructor(url: string, certificate: string, ca: string, hostname: string) {
    this.communicationUrl = url + COMMUNICATION_URL_PART;
    this.videoUrl = url + VIDEO_URL_PART;
    this.sequenceId = 1;
    this.hostname = hostname;
    this.dh = createDiffieHellman(
      MOBILE_SERVER_PUBLIC_KEY,
      "hex",
      MOBILE_SERVER_GENERATOR,
      "hex",
    );
    this.publicKey = toLittleEndianWireFormat(
      this.dh.generateKeys(),
      this.dh.getPrime().length,
    );

    const agent = new Agent({
      connect: {
        rejectUnauthorized: true,
        cert: Buffer.from(certificate, "base64").toString(),
        ca: Buffer.from(ca, "base64").toString(),
      },
      pipelining: 6,
    });

    this.dispatcher = agent.compose(
      interceptors.retry({
        methods: ["POST"],
        maxRetries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        timeoutFactor: 2,
        retryAfter: true,
      }),
    );
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
          host: this.hostname,
          accept: "application/json",
        },
        dispatcher: this.dispatcher,
        bodyTimeout: REQUEST_TIMEOUT_MILLIS,
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

    //    logger.debug("sending:" + xml);

    const resp = await this.post(this.communicationUrl, xml, configuration);

    //   logger.debug("response " + JSON.stringify(resp));

    if (resp.statusCode !== 200) {
      throw Error(`sendMessage failed ${JSON.stringify(resp)}`);
    }

    // it's actually xml, so we have to take it as text and then parse it
    const body = await resp.body.text();

    const response = (await parse(body)) as CommandResponse;
    command.checkError(response);

    return command.getResult(response);
  }

  async connect(): Promise<string> {
    const command = new ConnectCommand()
      // public key must be base64 encoded
      .addInputParameters("PublicKey", this.publicKey.toString("base64"))
      .addInputParameters("PrimeLength", "1024")
      .addInputParameters("EncryptionPadding", "PKCS7");

    // longer timeout for connect
    const connectResponse = await this.sendMessage(command, {
      bodyTimeout: 4000,
    });
    this.connectionId = connectResponse.connectionId;
    // public key is base64 encoded little-endian, convert to the big-endian format Node's crypto expects
    this.serverPublicKey = fromLittleEndianWireFormat(
      Buffer.from(connectResponse.publicKey, "base64"),
    );

    return this.connectionId;
  }

  login(username: string, password: string): Promise<void> {
    if (!this.serverPublicKey) {
      throw new Error("Server public key is not set");
    }

    const sharedSecret = this.dh.computeSecret(this.serverPublicKey);
    // IV/key are derived from the least-significant bytes first, i.e. little-endian
    const newSecret = padLeft(
      sharedSecret,
      this.dh.getPrime().length,
    ).reverse();

    const iv = newSecret.subarray(0, 16);
    const key = newSecret.subarray(16, 48);

    const usernameCipher = createCipheriv(
      "aes-256-cbc",
      key,
      iv,
    ).setAutoPadding(true);
    const passwordCipher = createCipheriv(
      "aes-256-cbc",
      key,
      iv,
    ).setAutoPadding(true);
    const encryptedUsername =
      usernameCipher.update(username, "utf8", "hex") +
      usernameCipher.final("hex");
    const encryptedPassword =
      passwordCipher.update(password, "utf8", "hex") +
      passwordCipher.final("hex");

    const command = new LoginCommand()
      // encrypt username and password using AES-256-CBC with the derived key and IV, base64 encoded
      .addInputParameters(
        "Username",
        Buffer.from(encryptedUsername, "hex").toString("base64"),
      )
      .addInputParameters(
        "Password",
        Buffer.from(encryptedPassword, "hex").toString("base64"),
      );

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
      message: `posting to ${streamUrl}`,
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
