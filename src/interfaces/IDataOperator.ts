import { Connection } from "src/models/Connection";
import { RequestData } from "src/models/RequestData";
import { Options } from "src/models/Options";
import { Port } from "src/models/Port";
import { Endpoint } from "src/models/Endpoint";
import { Handler } from "src/models/Shared/EventDispatcher";

export interface ShowStatusCodeEvent { }
export interface ReceiveDataEvent { }
export interface FailedConnectEvent { message: string; }

export interface IDataOperator{
    options: Options;
    originID: string;

    color: string;
    fillColor: boolean;

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
     * canConnectTo: return true if operator can connect to given port with wanted port
     */
    canConnectTo(port: Port, connectingWithOutput)

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
    onFailedConnect(handler: Handler<FailedConnectEvent>);

    onConnectionUpdate(wasOutput: boolean);

    destroy();
}
        