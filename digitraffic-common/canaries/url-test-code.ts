const url = process.env.url;

export const handler = async () => {
    console.info("canary checking url " + url);

    return "Canary completed succesfully"
};