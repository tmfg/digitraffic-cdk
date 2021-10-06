import { convertTextToSvg } from "../../service/text-converter";

export const handler = async (event: any): Promise<any> => {
    const start = Date.now();
    const text = event["text"] as string;

    try {
        return {
            body: convertTextToSvg(text)
        };
    } catch(e) {
        return {
            error: e
        };
    } finally {
        console.info("method=getSignImageLambda tookMs=%d", (Date.now()-start));
    }
};
