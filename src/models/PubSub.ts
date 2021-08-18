import { IDataOperator } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Port } from "./Port";
import { Endpoint } from "./Endpoint";
import { sleep, UUID } from "src/shared/ExtensionMethods";
import { EndpointOperator, EndpointOptions } from "./EndpointOperator";
import { HTTPMethod } from "./enums/HTTPMethod";

export class PubSub extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    outputPort: Port;
    connectionTable: {[id:string]:Connection} = {};
    options: PubSubOptions;
    color = "#FF7D35";

    constructor() {
        super();
        this.inputPort = new Port(this, false, true);        
        this.outputPort = new Port(this, true, true);        
        this.options = new PubSubOptions();
        this.options.title = "Pub/Sub Model";

        this.options.endpoints = [
            new Endpoint("post.postCreated", [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.PATCH, HTTPMethod.DELETE])
        ]
    }

    async receiveData(data: RequestData) {
        if(data.requestId == "" || data.requestId == null )
            throw new Error("requestId can not be null. Please specify property requestId of RequestData");

        this.fireReceiveData(data);

        // Put data to queue 
        data.header.stream = false;
        this.sendToConsumers(data);

        // Return response to publisher
        let response = new RequestData();
        response.responseId = data.requestId;
        response.requestId = UUID();
        response.header = data.header;
        response.origin = data.origin;
        response.originID = this.originID;

        // Send response back
        if(data.sendResponse)
            await this.inputPort.sendData(response, data.origin);
    }

    async sendToConsumers(message: RequestData){
        await sleep(200);
        
        this.sendData(message);
    }

    async sendData(data: RequestData){
        data.originID = this.originID;
        data.sendResponse = false;
        let targetEndpoint = data.header.endpoint.endpoint.url;
        let connections = this.outputPort.connections
        .filter(connection => connection.getOtherPort(this.outputPort).parent.getAvailableEndpoints()
        .find(ep => ep.url == targetEndpoint) != null);
        for(let connection of connections){
            data.origin = connection;
            this.outputPort.sendData(data,data.origin);
        }
    }
}

export class PubSubOptions extends EndpointOptions{
}

