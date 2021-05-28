import { Connection } from "src/models/Connection";
import { RequestData } from "src/models/RequestData";
import { Options } from "src/models/Options";
import { Port } from "src/models/Port";
import { Endpoint } from "src/models/Endpoint";
import { EventDispatcher, Handler } from "src/models/Shared/EventDispatcher";
import { HTTPStatus } from "src/models/enums/HTTPStatus";

export interface ShowStatusCodeEvent { }

export interface IDataOperator{
    /**
     * receiveData: receives data
     */
    receiveData(data: RequestData, fromOutput:boolean) : void;

    /**
     * sendData: sends data
     */
    sendData(data: RequestData) : void;

    /**
     * connectTo: connects to other operator via port
     */
    connectTo(operator: IDataOperator, connectingWithOutput:boolean, connectingToOutput:boolean) : Connection;

    /**
     * getPort: returns property port
     */
    getPort(outputPort:boolean) : Port;

    /**
     * getAvailableEndpoints: returns all endpoints, that can be accessed in/by this object
     */
    getAvailableEndpoints(): Endpoint[];

    options: Options;
    originID: string;

    onShowStatusCode(handler: Handler<ShowStatusCodeEvent>);

    destroy();
}
        