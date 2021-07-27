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

export class CloudStorageOptions extends EndpointOptions{
}