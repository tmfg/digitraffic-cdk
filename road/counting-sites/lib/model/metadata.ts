import {DbUserType} from "./usertype";
import {DbDomain} from "./domain";

export type MetadataResponse = {
    lastUpdated: Date | null;
    domains: DbDomain[];
    userTypes: DbUserType[];
    directions: Record<string, string>;
};
