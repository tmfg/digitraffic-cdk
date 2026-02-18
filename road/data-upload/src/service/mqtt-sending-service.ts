import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import { connectAsync } from "mqtt";
import { getRttiBySituationId } from "../dao/rtti.js";

const clientId = "mqtt-publisher" as const;

const PAYLOAD_TEMPLATE =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<d2:payload xsi:type="sit:SituationPublication" lang="fi" 
    xmlns:com="http://datex2.eu/schema/3/common" 
    xmlns:loc="http://datex2.eu/schema/3/locationReferencing" 
    xmlns:roa="http://datex2.eu/schema/3/roadTrafficData" 
    xmlns:fst="http://datex2.eu/schema/3/faultAndStatus" 
    xmlns:egi="http://datex2.eu/schema/3/energyInfrastructure" 
    xmlns:prk="http://datex2.eu/schema/3/parking" 
    xmlns:fac="http://datex2.eu/schema/3/facilities" 
    xmlns:ubx="http://datex2.eu/schema/3/urbanExtensions" 
    xmlns:locx="http://datex2.eu/schema/3/locationExtension" 
    xmlns:d2="http://datex2.eu/schema/3/d2Payload" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xmlns:tmp="http://datex2.eu/schema/3/trafficManagementPlan" 
    xmlns:comx="http://datex2.eu/schema/3/commonExtension" 
    xmlns:vms="http://datex2.eu/schema/3/vms" 
    xmlns:rer="http://datex2.eu/schema/3/reroutingManagementEnhanced" 
    xmlns:sit="http://datex2.eu/schema/3/situation">
    <com:publicationTime>PUBLICATION_TIME</com:publicationTime>
    <com:publicationCreator>
        <com:country>FI</com:country>
        <com:nationalIdentifier>FTA</com:nationalIdentifier>
    </com:publicationCreator>
    SITUATION
</d2:payload>` as const;

export async function sendMqttUpdates(
  url: string,
  username: string,
  password: string,
  ids: string[],
): Promise<void> {
  const rttiData = await inDatabaseReadonly((db) =>
    getRttiBySituationId(db, ids),
  );

  if (rttiData.length > 0) {
    const client = await connectAsync(url, {
      username,
      password,
      clean: false,
      clientId,
    });

    for (const rtti of rttiData) {
      // first zip and then base64 encode the message
      //            const mqttMessage = Buffer.from(gzipSync(rtti.message)).toString("base64");
      const topic = `traffic-message-v3/traffic-data/datex2-3.5/${rtti.is_srti ? "SRTI" : "RTTI"}`;

      await client.publishAsync(topic, createMessage(rtti.message));
    }

    await client.endAsync();
  } else {
    logger.error({
      method: "MqttSendingService.sendMqttUpdate",
      error: `Could not find RTTI data for situation ids ${ids.join(", ")}`,
    });
  }
}

function createMessage(datexSituation: string): string {
  return PAYLOAD_TEMPLATE.replace(
    "PUBLICATION_TIME",
    new Date().toISOString(),
  ).replace("SITUATION", datexSituation);
}
