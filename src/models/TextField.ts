import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { UUID } from "src/shared/ExtensionMethods";
import { Connection } from "./Connection";
import { Endpoint } from "./Endpoint";
import { LogicComponent } from "./LogicComponent";
import { Options } from "./Options";
import { RequestData } from "./RequestData";
import { Handler } from "./Shared/EventDispatcher";

export class TextField extends LogicComponent implements IDataOperator{
    
    options: TextFieldOptions;
    originID: string;

    constructor() {
        super();
        this.options = new TextFieldOptions();
        this.options.title = "Text Field";
        this.originID = UUID();
    }
    
    receiveData(data: RequestData, fromOutput: boolean): void { 
        return;
    }
    sendData(data: RequestData): void { 
        return;
    }
    connectTo(operator: IDataOperator, connectingWithOutput: boolean, connectingToOutput: boolean): Connection {
        return null;
    }
    getAvailableEndpoints(): Endpoint[] {
        return [];
    }
    onShowStatusCode(handler: Handler<ShowStatusCodeEvent>) {
        return;
    }
    onConnectionUpdate(wasOutput: boolean = false){
        return;
    }

    destroy = () => {}
}

export class TextFieldOptions extends Options{
    fontSize: number = 12;
    isBold: boolean = false;
    isItalic: boolean = false;
}