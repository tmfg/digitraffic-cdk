import {Camera} from "../model/camera";

const FIELD_COMMUNICATION = "Communication";
const FIELD_COMMAND = "Command"

export class Command {
    readonly name: string;
    readonly inputParameters: any;

    constructor(name: string) {
        this.inputParameters = {};
        this.name = name;
    }

    addInputParameters(name: string, value: string): Command {
        this.inputParameters[name] = value;

        return this;
    }

    createInputParameters(): string {
        let inputs = '';

        for(let [key,value] of Object.entries(this.inputParameters)) {
            inputs+= `<Param Name="${key}" Value="${value}"/>`;
        }

        return `<InputParams>${inputs}</InputParams>`;
    }

    createXml(sequenceId: number, connectionId: string|null): string {
        const connection = connectionId == null ? '<ConnectionId/>' : `<ConnectionId>${connectionId}</ConnectionId>`;

        return `<?xml version="1.0" encoding="utf-8"?>
<Communication xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        ${connection}
        <Command SequenceId="${sequenceId}">
            <Type>Request</Type>
            <Name>${this.name}</Name>
            ${this.createInputParameters()}
            <OutputParams/>            
        </Command>
</Communication>
`;
    }

    getResult(result: any): any {
        return result;
    }

    checkError(result: any) {
        const resultCode = result[FIELD_COMMUNICATION][FIELD_COMMAND].Result;

        if (resultCode == 'Error') {
            throw new Error('Command Failed');
        }
    }
}

export class ConnectCommand extends Command {
    constructor() {
        super('Connect');
    }

    getResult(response: any): any {
        return response[FIELD_COMMUNICATION][FIELD_COMMAND][0].OutputParams[0].Param[0].$.Value;
    }
}

export class GetAllCamerasCommand extends Command {
    constructor() {
        super('GetAllViewsAndCameras');
    }

    getResult(response: any): Camera[] {
        const cameras = response[FIELD_COMMUNICATION][FIELD_COMMAND][0].Items[0].Item[0].Items[0].Item[0].Items[0].Item[0].Items[0].Item;

        const info = cameras.map((c: any) => {
            return {
                id: c.$.Id,
                name: c.$.Name,
                type: c.$.Type
            }
        });

        console.info(JSON.stringify(info, null, 3));

        return info;
    }
}

export class LoginCommand extends Command {
    constructor() {
        super('Login');
    }
}

export class GetThumbnailCommand extends Command {
    constructor() {
        super('GetThumbnail');
    }

    getResult(response: any): any {
        return response[FIELD_COMMUNICATION][FIELD_COMMAND][0].Thumbnail;
    }
}