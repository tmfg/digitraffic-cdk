export const handler = async (event: any): Promise<any> => {
    const start = Date.now();

    try {
        return "OK!";
    } finally {
        console.info("method=updateData tookMs=%d", (Date.now()-start));
    }
};