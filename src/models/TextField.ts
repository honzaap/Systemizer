import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { Endpoint } from "./Endpoint";
import { LogicComponent } from "./LogicComponent";
import { Options } from "./Options";
import { RequestData } from "./RequestData";
import { Handler } from "./Shared/EventDispatcher";

export class TextField extends LogicComponent implements IDataOperator{
    
    options: TextFieldOptions;

    constructor() {
        super();
        this.options = new TextFieldOptions();
        this.options.title = "Text Field";
    }
    
    receiveData(data: RequestData, fromOutput: boolean): void { 
        return;
    }
    sendData(data: RequestData): void { 
        return;
    }
    getAvailableEndpoints(): Endpoint[] {
        return [];
    }

    destroy = () => {}
}

export class TextFieldOptions extends Options{
    width: number = 140;
    height: number = 60;
    fontSize: number = 12;
    isBold: boolean = false;
    isItalic: boolean = false;
    backgroundColor: string = "rgba(0, 0, 0, 0.5)";
    color: string = "#fff";
}