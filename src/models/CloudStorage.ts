import { IDataOperator } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { EndpointOperator, EndpointOptions } from "./EndpointOperator";
import { Endpoint } from "./Endpoint";
import { HTTPMethod } from "./enums/HTTPMethod";
import { Port } from "./Port";
import { RequestData } from "./RequestData";

export class CloudStorage extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    options: CloudStorageOptions;
    connectionTable: { [id:string]: Connection } = {};
    fillColor = false;
    color = "#dd1818";

    constructor() {
        super();
        this.inputPort = new Port(this,false,true);      
        this.options = new CloudStorageOptions();  
        this.options.title = "Cloud Storage";
        
        this.options.endpoints = [
            new Endpoint("/cloud",[HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.DELETE])    
        ]
    }

    async receiveData(data: RequestData) {
        let targetEndpoint = this.getTargetEndpoint(data);
        if(targetEndpoint == null)
            return;

        this.fireReceiveData(data);
        this.requestReceived();

        this.connectionTable[data.requestId] = data.origin;

        await this.throttleThroughput(targetEndpoint.actions.length > 0);

        // Send response back
        this.requestProcessed();
        if(data.sendResponse)
            await this.sendData(this.getResponse(data));
    }

    async sendData(response: RequestData) {
        let targetConnection = this.connectionTable[response.responseId]
        if(targetConnection == null)
            throw new Error("Target connection can not be null");
        this.connectionTable[response.responseId] = null; // reset request id
        await this.inputPort.sendData(response, targetConnection);
    }
}

export class CloudStorageOptions extends EndpointOptions{
}    
