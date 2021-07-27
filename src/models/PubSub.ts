import { IDataOperator } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Port } from "./Port";
import { Endpoint } from "./Endpoint";
import { sleep, UUID } from "src/shared/ExtensionMethods";
import { API } from "./API";
import { EndpointOperator, EndpointOptions } from "./EndpointOperator";
import { HTTPMethod } from "./enums/HTTPMethod";

export class PubSub extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    outputPort: Port;
    connectionTable: {[id:string]:Connection} = {};
    options: PubSubOptions;
    isSubscribable: boolean = true;

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
        //console.log("Message Queue got data: ",data);
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
        await this.inputPort.sendData(response, data.origin);
    }

    async sendToConsumers(message: RequestData){
        await sleep(200);
        message.header.endpoint.method = HTTPMethod.POST;
        this.sendData(message);
    }

    async sendData(data: RequestData){
        data.originID = this.originID;
        let targetEndpoint = data.header.endpoint.endpoint.url;
        let connections = this.outputPort.connections.filter(connection => {
            return (connection.getOtherPort(this.outputPort).parent.options as EndpointOptions).endpoints
                .find(ep => ep.url == targetEndpoint) != null;
        });
        for(let connection of connections){
            data.origin = connection;
            this.outputPort.sendData(data,data.origin);
        }
    }

    onConnectionUpdate(wasOutput: boolean = false){
    }

    connectTo(operator: IDataOperator, connectingWithOutput: boolean, connectingToOutput: boolean) : Connection{
        let otherPort = operator.getPort(connectingToOutput);
        if(!this.canConnectTo(otherPort, connectingWithOutput)) 
            return null;
        if(!operator.canConnectTo(this.getPort(connectingWithOutput), connectingToOutput)) 
            return null; 
        if(connectingWithOutput){
            let conn = this.outputPort.connectTo(otherPort);
            if(conn != null && operator instanceof API)
                (operator as API).initiateConsumer(conn, true);
            return conn;
        }
        return this.inputPort.connectTo(otherPort);
    }

    canConnectTo(port: Port, connectingWithOutput: boolean){
        if(!super.canConnectTo(port, connectingWithOutput))
            return false;
        // Output of PubSun can connect only to API  
        if(!connectingWithOutput)
            return true;
        if(port.parent instanceof API)
            return true;
        this.fireFailedConnect({message: "Output of a PubSub can only be connected to an API."});            
        return false;
    }

    getAvailableEndpoints(): Endpoint[]{
        return this.options.endpoints;
    }
}

export class PubSubOptions extends EndpointOptions{
}

