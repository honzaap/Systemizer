import { IDataOperator } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData, RequestDataHeader } from "./RequestData";
import { Port } from "./Port";
import { UUID } from "src/shared/ExtensionMethods";
import { Protocol } from "./enums/Protocol";
import { Endpoint } from "./Endpoint";
import { HTTPMethod } from "./enums/HTTPMethod";
import { HTTPStatus } from "./enums/HTTPStatus";
import { EndpointOperator, EndpointOptions } from "./EdpointOperator";

export class CloudStorage extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    options: CloudStorageOptions;
    connectionTable: { [id:string]: Connection } = {};
    originID: string;

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

    destroy(){
        this.inputPort.removeConnections();
    }
}

export class CloudStorageOptions extends EndpointOptions{
}