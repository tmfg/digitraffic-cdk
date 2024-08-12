declare global {
    namespace NodeJS {
        interface ProcessEnv {
            ES_ENDPOINT: string;
            KNOWN_ACCOUNTS: string;
            AWS_SECRET_ACCESS_KEY: string;
        }
    }
}
export {};
