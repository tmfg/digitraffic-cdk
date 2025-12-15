import { parseStringPromise } from "xml2js";
import type { Datex35File, Situation } from "./vs-datex2-35-parser.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export type RttiType = "PLACEHOLDER";

export interface Rtti35Situation {  
  readonly situationId: string
  readonly type: RttiType
  readonly publicationTime: Date
  readonly geometry: string
  readonly startTime: Date
  readonly endTime?: Date
  readonly isSrti: boolean
  readonly message: string
}

export async function parseRtti35(datex2: string): Promise<Rtti35Situation> {
    const xml = await parseStringPromise(datex2) as Datex35File;
    const publicationTime = xml["d2:payload"]["com:publicationTime"];
    const type  = "PLACEHOLDER";
  
    const situations = xml["d2:payload"]["sit:situation"];
  
    if(situations.length > 1) {
      logger.error({
          method: "Rtti35Parser.parseRtti35", 
          error : `More than one situation found in RTTI Datex2 3.5 message`
      });
    }

    return parseSituation(datex2, situations[0]!, publicationTime, type);
}

function parseSituation(datex2: string, situation: Situation, publicationTime: Date, type: RttiType): Rtti35Situation {
    const situationId = situation.$.id;
    const {startTime, endTime} = getValidityPeriod(situation);

    const geometry = "LINESTRING(0 0,1 1,2 1,2 2)";
    const isSrti = datex2.includes("safetyRelatedMessage>true");

    return {
        situationId,
        type,
        publicationTime,
        geometry,
        startTime,
        endTime,
        isSrti,
        message: datex2,
    };
  };

function getValidityPeriod(situation: Situation): { startTime: Date; endTime?: Date } {
    const record = situation["sit:situationRecord"][0];

    if(record) {
        const validity = record["sit:validity"][0];
        if(validity) {
            const timeSpec = validity["com:validityTimeSpecification"][0];
            if(timeSpec) {
                const overallStartTime = timeSpec["com:overallStartTime"][0];
                const overallEndTime = timeSpec["com:overallEndTime"]?.[0];
                if(overallStartTime && overallEndTime) {
                    return { startTime: overallStartTime, endTime: overallEndTime };
                }
            }
        }   
    }

    return { startTime: new Date(), endTime: undefined };
}