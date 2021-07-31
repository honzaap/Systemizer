import { IDataOperator } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { EndpointOperator, EndpointOptions } from "./EndpointOperator";
import { Endpoint } from "./Endpoint";
import { HTTPMethod } from "./enums/HTTPMethod";
import { Port } from "./Port";
import { RequestData } from "./RequestData";

export class WebServer extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    options: WebServerOptions;
    connectionTable: { [id:string]: Connection } = {};
    fillColor = false;
    color = "#009FFF";

    constructor() {
        super();
        this.inputPort = new Port(this,false,true);      
        this.options = new WebServerOptions();  
        this.options.title = "Web Server";
        
        this.options.endpoints = [
            new Endpoint("/",[HTTPMethod.GET])    
        ]
    }

    async receiveData(data: RequestData) {
        let targetEndpoint = this.getTargetEndpoint(data);
        if(targetEndpoint == null)
            return;

        this.connectionTable[data.requestId] = data.origin;
        this.fireReceiveData(data);

        await this.sendData(this.getResponse(data));
    }

    onConnectionUpdate(wasOutput: boolean = false){}

    async sendData(response: RequestData) {
        let targetConnection = this.connectionTable[response.responseId]
        if(targetConnection == null)
            throw new Error("Target connection can not be null");
        this.connectionTable[response.responseId] = null; // reset request id
        await this.inputPort.sendData(response, targetConnection);
    }

    getAvailableEndpoints(): Endpoint[]{
        return this.options.endpoints;
    }
}

export class WebServerOptions extends EndpointOptions{
}