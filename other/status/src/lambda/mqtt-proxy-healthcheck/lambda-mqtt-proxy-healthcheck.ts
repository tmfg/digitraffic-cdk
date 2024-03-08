import type { ProxyLambdaResponse } from "@digitraffic/common/dist/aws/types/proxytypes";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { setTimeout } from "timers/promises";
import mqtt from "mqtt";

export const KEY_APP = "KEY_APP";
const PROTOCOL = "wss";
const CLIENT_ID = "hc-proxy";

/**
 * timeout in milliseconds.
 */
const TIMEOUT = 9 * 1000;

const defaultOptions = {
    port: 443,
    username: "digitraffic",
    password: "digitrafficPassword"
};

const getApp: () => string = () => getEnvVariable(KEY_APP);

type ConnectionStatus = "success" | "timeout";

export async function handler(): Promise<ProxyLambdaResponse> {
    const client = mqtt.connect(`${PROTOCOL}://${getApp()}.digitraffic.fi/mqtt`, {
        ...defaultOptions,
        clientId: CLIENT_ID
    });

    const connectPromise = new Promise((resolve: (value: ConnectionStatus) => void) => {
        client.on("connect", () => {
            resolve("success");
        });
    });

    const result: ConnectionStatus = await Promise.race([
        connectPromise,
        setTimeout<"timeout">(TIMEOUT, "timeout")
    ]).finally(() => {
        client.end();
    });

    const resp = {
        statusCode: result === "success" ? 200 : 500,
        body: ""
    };

    return resp;
}
