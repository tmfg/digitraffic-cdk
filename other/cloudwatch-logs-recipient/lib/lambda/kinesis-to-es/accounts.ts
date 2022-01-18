import {Account} from "../../app-props";

export function getAppFromSenderAccount(owner: string, knownAccounts: Account[]): string {
    const app = knownAccounts.find(value => {
        if (value.accountNumber === owner) {
            return true;
        }
        return null;
    })?.app;
    if (!app) {
        throw new Error('No app for account ' + owner);
    } else {
        return app;
    }
}

export function getEnvFromSenderAccount(owner: string, knownAccounts: Account[]): string {
    const env = knownAccounts.find(value => {
        if (value.accountNumber === owner) {
            return true;
        }
        return null;
    })?.env;
    if (!env) {
        throw new Error('No env for account ' + owner);
    } else {
        return env;
    }
}

