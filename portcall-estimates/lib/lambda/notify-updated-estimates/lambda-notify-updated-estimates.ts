import {SNSEvent, SNSEventRecord} from "aws-lambda";
import {UpdatedEstimate} from "../../service/estimates";
import {compose, flatten, isNil, map, reject, uniq} from "ramda";
import {findSubscriptions} from "../../service/subscriptions";
import {ShipIdType} from "../../db/db-estimates";

export const handler = async (event: SNSEvent): Promise<any> => {
    // @ts-ignore
    const ships = compose(uniq, reject(isNil), flatten, flatten, map((r: SNSEventRecord) => JSON.parse(r.Sns.Message)))(event.Records) as UpdatedEstimate[];
    const mmsis = ships.filter(s => s.ship_id_type == ShipIdType.MMSI).map(s => s.ship_id as number);
    const imos = ships.map(s => s.ship_id_type == ShipIdType.IMO ? s.ship_id : s.secondary_ship_id).filter(id => id != null) as number[];
    const subs = await findSubscriptions(mmsis, imos);


};
