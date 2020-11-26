import {DbSubscriptionInfo} from "../db/db-info";
import * as DbInfo from '../db/db-info';

export async function getInfo(): Promise<DbSubscriptionInfo[]> {
    const info = await DbInfo.getInfo();
    return info.Items as DbSubscriptionInfo[];
}

export async function increaseSmsSentAmount() {
    return await DbInfo.increaseSmsSentAmount();
}

export async function increaseSmsReceivedAmount() {
    return await DbInfo.increaseSmsReceivedAmount();
}
