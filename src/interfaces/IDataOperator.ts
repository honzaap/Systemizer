import { Connection } from "src/models/Connection";
import { RequestData } from "src/models/RequestData";
import { Options } from "src/models/Options";
import { Port } from "src/models/Port";
import { Endpoint } from "src/models/Endpoint";
import { Handler } from "src/models/Shared/EventDispatcher";

export interface ShowStatusCodeEvent { }
export interface ReceiveDataEvent { }

export interface IDataOperator{
    options: Options;
    originID: string;

    /**
     * receiveData: receives data
     */
    receiveData(data: RequestData, fromOutput: boolean): void;

    /**
     * sendData: sends data
     */
    sendData(data: RequestData) : void;

    /**
     * connectTo: connects to other operator via port
     */
    connectTo(operator: IDataOperator, connectingWithOutput: boolean, connectingToOutput: boolean): Connection;

    /**
     * getPort: returns property port
     */
    getPort(outputPort:boolean): Port;

    /**
     * getAvailableEndpoints: returns all endpoints, that can be accessed in/by this object
     */
    getAvailableEndpoints(): Endpoint[];

    onShowStatusCode(handler: Handler<ShowStatusCodeEvent>);
    onReceiveData(handler: Handler<ReceiveDataEvent>);

    onConnectionUpdate(wasOutput: boolean);

    destroy();
}
        