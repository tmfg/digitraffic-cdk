import axios from "axios";

export class StatusReportApi {

    private readonly reportUrl: string;

    constructor(reportUrl: string) {
        this.reportUrl = reportUrl;
    }

    async sendReport(reportLines: string[]) {
        console.info('method=sendReport Sending report..');
        const reportText = reportLines.join('\n');
        const resp = await axios.post(this.reportUrl, JSON.stringify({ text: reportText }), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (resp.status !== 200) {
            throw new Error('Unable to send report');
        }
        console.info('..done');
    }

}
