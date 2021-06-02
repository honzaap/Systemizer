import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { Endpoint } from "./Endpoint";
import { Options } from "./Options";
import { Port } from "./Port";
import { RequestData } from "./RequestData";
import { Handler } from "./Shared/EventDispatcher";




export class TextField implements IDataOperator{

    options: TextFieldOptions;

    constructor() {
        this.options = new TextFieldOptions();
        this.options.title = "Text Field"
    }
    receiveData(data: RequestData, fromOutput: boolean): void { }
    sendData(data: RequestData): void { }
    connectTo(operator: IDataOperator, connectingWithOutput: boolean, connectingToOutput: boolean): Connection {
        throw new Error("Method not implemented.");
    }
    getPort(outputPort: boolean): Port {
        throw new Error("Method not implemented.");
    }
    getAvailableEndpoints(): Endpoint[] {
        throw new Error("Method not implemented.");
    }
    originID: string;
    onShowStatusCode(handler: Handler<ShowStatusCodeEvent>) {
        
    }

    onConnectionRemove(wasOutput: boolean = false){}

    destroy = () => {}

}

export class TextFieldOptions extends Options{
    fontSize: number = 12;
    isBold: boolean = false;
    isItalic: boolean = false;
}