import { IDataOperator } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData, RequestDataHeader } from "./RequestData";
import { Port } from "./Port";
import { UUID } from "src/shared/ExtensionMethods";
import { Protocol } from "./enums/Protocol";
import { DatabaseEndpoint, Endpoint, EndpointRef } from "./Endpoint";
import { HTTPStatus } from "./enums/HTTPStatus";
import { EndpointOperator, EndpointOptions } from "./EdpointOperator";
import { DatabaseType } from "./enums/DatabaseType";

export class Database extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    outputPort: Port
    options: DatabaseOptions;
    connectionTable: {[id:string]:Connection} = {};
    originID: string;

    constructor() {
        super();
        this.inputPort = new Port(this,false,true);      
        this.outputPort = new Port(this,true,true);      
        this.options = new DatabaseOptions();  
        this.options.title = "Database";
        this.originID = UUID();
        
        this.options.endpoints = [
            new DatabaseEndpoint("/database")    
        ]
    }

    async receiveData(request: RequestData, fromOutput = false) {
        if(fromOutput) 
            return;
        // Checking for 404
        let hasEndpoint = false;
        for(let endpoint of this.options.endpoints){
            if(endpoint.url === request.header.endpoint.endpoint.url)
                hasEndpoint = true;
         }
        if(!hasEndpoint){
            this.fireShowStatusCode(HTTPStatus["Not Found"])
            return;
        }

        this.fireReceiveData(request);
        if(this.options.isMasterShard){
            let length = this.outputPort.connections.length;
            if(length == 0)
                this.options.isMasterShard = false;
            else{
                let shardRequest = new RequestData();
                let conn = this.outputPort.connections[Math.round(Math.random() * (length-1))]; // Select random shard to send data to 
                let epRef = new EndpointRef();
                epRef.method = request.header.endpoint.method;
                epRef.endpoint = new DatabaseEndpoint("/shard")

                shardRequest.header = new RequestDataHeader(epRef, Protocol.HTTP);
                shardRequest.origin = conn;
                shardRequest.originID = this.originID;
                shardRequest.requestId = UUID();
                this.connectionTable[shardRequest.requestId] = shardRequest.origin;
                await this.outputPort.sendData(shardRequest, conn);
            }
        }
        this.connectionTable[request.requestId] = request.origin;
        let response = new RequestData();
        response.header = new RequestDataHeader(request.header.endpoint, Protocol.HTTP);
        response.origin = request.origin;
        response.originID = this.originID;
        response.requestId = UUID();
        response.responseId = request.requestId;
        await this.sendData(response);
    }

    onConnectionUpdate(wasOutput: boolean = false){}

    async sendData(response: RequestData) {
        let targetConnection = this.connectionTable[response.responseId]
        if(targetConnection == null)
            throw new Error("Target connection can not be null");
        this.connectionTable[response.responseId] = null; // reset request id
        await this.inputPort.sendData(response, targetConnection);
    }

    canConnectTo(port: Port, connectingWithOutput: boolean){
        if(!super.canConnectTo(port, connectingWithOutput))
        return false;
        // Output of database can connect only to database shard of the same type
        if(!connectingWithOutput)
            return true;
        return port.parent instanceof Database && this.options.isMasterShard && port.parent.options.isShard && port.parent.options.type == this.options.type;
    }

    getAvailableEndpoints(): Endpoint[]
    {
        return this.options.endpoints;
    }

    destroy(){
        this.inputPort.removeConnections();
        this.outputPort.removeConnections();
    }
}

export class DatabaseOptions extends EndpointOptions{
    type: DatabaseType;
    isMasterShard: boolean;
    isShard: boolean;
}