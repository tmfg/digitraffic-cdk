import {DbDomainContract, DbMaintenanceTracking} from "../lib/model/db-data";
import moment from "moment";
import {GeoJsonLineString, GeoJsonPoint} from "digitraffic-common/utils/geometry";

export const HARJA_BRUSHING = 'BRUSHING';
export const HARJA_PAVING = 'PAVING';
export const HARJA_SALTING = 'SALTING';

export const POINT_START = [24.357378937891166, 61.677682759232574];
export const POINT_450m_FROM_START = [24.365897599952387, 61.67781512377241];
export const POINT_550m_FROM_START =  [24.36779658877416, 61.67777439983574];


export function createDbDomainContract(contract : string, domain : string, dataLastUpdated?:Date) : DbDomainContract {
    return {
        contract: contract,
        data_last_updated: dataLastUpdated,
        domain: domain,
        start_date: moment().subtract(30, 'days').toDate(),
        end_date: moment().add(30, 'days').toDate(),
        name: "Urakka 1",
        source: "Foo / Bar",
    };
}

export function createDbMaintenanceTracking(
    contract: DbDomainContract,
    workMachineId: bigint, startTime: Date, endTime: Date, harjaTasks: string[], lastPoint: GeoJsonPoint, lineString?: GeoJsonLineString,
) : DbMaintenanceTracking {
    return {
        direction: 0,
        sending_time: endTime,
        start_time: startTime,
        end_time: endTime,
        last_point: lastPoint,
        line_string: lineString ? lineString : null,
        sending_system: contract.domain,
        work_machine_id: workMachineId,
        tasks: harjaTasks,
        domain: contract.domain,
        contract: contract.contract,
        message_original_id: 'none',
        finished: false,
    };
}