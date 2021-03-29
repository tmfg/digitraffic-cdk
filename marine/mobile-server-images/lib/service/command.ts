const FIELD_COMMUNICATION = "Communication";
const FIELD_COMMAND = "Command"

export class Command {
    name: string;
    connectionId: string|null;
    inputParameters: any;

    constructor(name: string) {
        this.inputParameters = {};
        this.name = name;
    }

    setConnectionId(connectionId: string): Command {
        this.connectionId = connectionId;

        return this;
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

    createXml(sequenceId: number): string {
        const connection = this.connectionId == null ? '<ConnectionId/>' : `<ConnectionId>${this.connectionId}</ConnectionId>`;

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

    getResult(response: any): any {
        const cameras = response.Communication.Command[0].Items[0].Item[0].Items[0].Item[0].Items[0].Item[0].Items[0].Item;

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