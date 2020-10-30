import * as InfoService from '../../service/info';

export async function handler() {
    const info = await InfoService.getInfo();
    return {
        status: 200,
        body: {
            smsReceived: info.SmsReceivedAmount,
            smsSent: info.SmsSentAmount
        }
    };
}
