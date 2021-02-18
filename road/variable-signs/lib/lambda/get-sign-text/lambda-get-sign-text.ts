import { convertTextToSvg } from "../../service/text-converter";

export const handler = async (event: any, context: any, callback: any): Promise<any> => {
    const start = Date.now();
    const text = event["text"] as string;

    try {
        const image = convertTextToSvg(text);

        callback(null, {
            body: image
        });
    } finally {
        console.info("method=findActiveSignsDatex2 tookMs=%d", (Date.now()-start));
    }
};
