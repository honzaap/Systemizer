import { IDataOperator } from "src/interfaces/IDataOperator";
import { UUID } from "src/shared/ExtensionMethods";
import { Connection } from "./Connection";
import { EndpointOperator, EndpointOptions } from "./EndpointOperator";
import { DatabaseEndpoint, Endpoint, EndpointRef } from "./Endpoint";
import { DatabaseType } from "./enums/DatabaseType";
import { Protocol } from "./enums/Protocol";
import { Port } from "./Port";
import { RequestData, RequestDataHeader } from "./RequestData";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";

interface RemoveShardEvent{

}

export class Database extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    outputPort: Port
    options: DatabaseOptions;
    connectionTable: {[id:string]:Connection} = {};

    constructor() {
        super();
        this.inputPort = new Port(this,false,true);      
        this.outputPort = null;//new Port(this,true,true);      
        this.options = new DatabaseOptions();  
        this.options.title = "Database";
        
        this.options.endpoints = [
            new DatabaseEndpoint("/database")    
        ]
    }

    async receiveData(request: RequestData, fromOutput = false) {
        if(fromOutput) 
            return;
        let targetEndpoint = this.getTargetEndpoint(request);
        if(targetEndpoint == null)
            return;

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
        await this.sendData(this.getResponse(request));
    }

    onConnectionUpdate(wasOutput: boolean = false){
        if(wasOutput && this.outputPort != null && this.outputPort.connections.length == 0){
            this.options.isMasterShard = false;
            this.outputPort = null;
            this.fireRemoveShard({});
        }
    }

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
        
        if(port.parent instanceof Database && this.options.isMasterShard && port.parent.options.isShard && port.parent.options.type == this.options.type)
            return true;
        this.fireFailedConnect({message: "Output of a Database can only be connected to database shard of same type."});
        return false;
    }

    getAvailableEndpoints(): Endpoint[]{
        return this.options.endpoints;
    }

    protected removeShardDispatcher = new EventDispatcher<RemoveShardEvent>();
    public onRemoveShard(handler: Handler<RemoveShardEvent>) {
        this.removeShardDispatcher.register(handler);
    }
    protected fireRemoveShard(event: RemoveShardEvent) { 
        this.removeShardDispatcher.fire(event);
    }
}

export class DatabaseOptions extends EndpointOptions{
    type: DatabaseType;
    isMasterShard: boolean;
    isShard: boolean;
}