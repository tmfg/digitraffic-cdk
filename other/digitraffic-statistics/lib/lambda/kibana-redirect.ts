export const handler = async () => {
    return {
        statusCode: 301,
        headers: {
            "Location": process.env.KIBANA_URL,
        }
    }
};
