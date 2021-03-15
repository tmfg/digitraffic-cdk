import {uploadArea} from "../api/vis-api";

// TODO client cert authentication
export async function sendFault(faultS124: string, url: string) {
    const start = Date.now();
    await uploadArea(faultS124, url);
    console.info(`method=sendFault tookMs=%d`, Date.now() - start);
}
