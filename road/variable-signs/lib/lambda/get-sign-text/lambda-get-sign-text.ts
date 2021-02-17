import { convertTextToSvg } from "../../service/text-converter";

export const handler = async (event: any): Promise<any> => {
    const start = Date.now();
    const text = event["text"] as string;

    try {
        return {
            body: convertTextToSvg(text)
        };
    } finally {
        console.info("method=findActiveSignsDatex2 tookMs=%d", (Date.now()-start));
    }
};
