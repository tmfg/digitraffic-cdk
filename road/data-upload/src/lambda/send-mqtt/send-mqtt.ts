import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { GenericSecret } from "@digitraffic/common/dist/aws/runtime/secrets/secret";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { Identifiable } from "@digitraffic/common/dist/database/models";
import type { SQSEvent } from "aws-lambda";
import { sendMqttUpdates } from "../../service/mqtt-sending-service.js";

const method = `SendMqtt.handler` as const;

interface MqttOptionsSecret extends GenericSecret {
  username: string;
  password: string;
  url: string;
}

const secretHolder = SecretHolder.create<MqttOptionsSecret>("mqtt.server");
const proxyHolder = ProxyHolder.create();

export const handler = async (event: SQSEvent): Promise<void> => {
  try {
    const secret = await secretHolder.get();
    await proxyHolder.setCredentials();

    const updates: string[] = event.Records.map((record) => {
      const body = record.body;

      return (JSON.parse(body) as Identifiable<string>).id;
    });

    logger.info({
      method,
      message: "Sending MQTT updates",
      customUpdateCount: updates.length,
    });

    await sendMqttUpdates(
      secret.url,
      secret.username,
      secret.password,
      updates,
    );
  } catch (error) {
    logger.error({
      method,
      error,
    });
  }
};
