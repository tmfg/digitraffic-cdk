export const handler = () => {
    return {
        statusCode: 301,
        headers: {
            Location: process.env["KIBANA_URL"]
        }
    };
};
