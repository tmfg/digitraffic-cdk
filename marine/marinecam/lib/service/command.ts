export interface CommandResponse {
    readonly Communication: {
        readonly Command: ResponseCommand[]
    }
}

interface ResponseCommand {
    readonly Result: string
    readonly OutputParams: {
        Param: ResponseParam[]
    }[]
    readonly Items: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
    readonly Thumbnail?: string[]
}

interface ResponseParam {
    "$": {
        Name: string
        Value: string
    }
}

export abstract class Command<T> {
    readonly name: string;
    readonly inputParameters: Record<string, string>;

    protected constructor(name: string) {
        this.inputParameters = {};
        this.name = name;
    }

    public addInputParameters(name: string, value: string): this {
        this.inputParameters[name] = value;

        return this;
    }

    public createInputParameters(): string {
        let inputs = '';

        for (const [key,value] of Object.entries(this.inputParameters)) {
            inputs+= `<Param Name="${key}" Value="${value}"/>`;
        }

        return `<InputParams>${inputs}</InputParams>`;
    }

    public createXml(sequenceId: number, connectionId: string|null): string {
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

    public abstract getResult(result: CommandResponse): T;

    public checkError(result: CommandResponse) {
        const resultCode = result.Communication.Command[0].Result;

        if (resultCode === 'Error') {
            console.error("Command failed: " + JSON.stringify(result));

            throw new Error('Command Failed ' + resultCode);
        }
    }
}

class DefaultCommand extends Command<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getResult(result: CommandResponse): void {
        // do nothing
    }
}

export class ConnectCommand extends Command<string> {
    constructor() {
        super("Connect");
    }

    public getResult(response: CommandResponse): string {
        return response.Communication.Command[0].OutputParams[0].Param[0].$.Value;
    }
}

export class LoginCommand extends DefaultCommand {
    constructor() {
        super("Login");
    }
}

function getFirstFromNullable<T>(array?: T[]): T {
    if(!array) {
        throw Error("array not set!");
    }

    return array[0];
}

export class GetThumbnailCommand extends Command<string> {
    constructor() {
        super("GetThumbnail");
    }

    public getResult(response: CommandResponse): string {
        return getFirstFromNullable(response.Communication.Command[0].Thumbnail);
    }
}

export class GetThumbnailByTimeCommand extends Command<string> {
    constructor() {
        super("GetThumbnailByTime");
    }

    public getResult(response: CommandResponse): string {
        return getFirstFromNullable(response.Communication.Command[0].Thumbnail);
    }
}

export class RequestStreamCommand extends Command<string> {
    constructor() {
        super("RequestStream");
    }

    public getResult(response: CommandResponse): string {
        const output = response.Communication.Command[0].OutputParams[0].Param;

        const videoId = output.find(o => o.$.Name === "VideoId");

        return videoId?.$.Value ?? "";
    }
}

export class ChangeStreamCommand extends DefaultCommand {
    constructor() {
        super("ChangeStream");
    }
}

export class CloseStreamCommand extends DefaultCommand {
    constructor() {
        super("CloseStream");
    }
}
