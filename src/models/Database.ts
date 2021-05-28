import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Options } from "./Options";
import { Port } from "./Port";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";
import { UUID } from "src/shared/ExtensionMethods";
import { Protocol } from "./enums/Protocol";
import { DatabaseEndpoint, Endpoint, EndpointRef } from "./Endpoint";
import { HTTPMethod } from "./enums/HTTPMethod";
import { HTTPStatus } from "./enums/HTTPStatus";
import { EndpointOperator, EndpointOptions } from "./EdpointOperator";
import { DatabaseType } from "./enums/DatabaseType";

interface ReceiveDataEvent { }

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
        if(fromOutput) return;
        // Checking for 404
        let was = false;
        let targetEndpoint: Endpoint;
        for(let endpoint of this.options.endpoints){
            if(endpoint.url === request.header.endpoint.endpoint.url){
                was = true;
            }
         }
        if(!was){
            this.fireShowStatusCode(HTTPStatus["Not Found"])
            return;
        }

        this.fireReceiveData(request);
        if(this.options.isMasterShard){
            let length = this.outputPort.connections.length;
            if(length == 0){
                this.options.isMasterShard = false;
            }
            else{
                let newRequest = new RequestData();
                let conn = this.outputPort.connections[Math.round(Math.random() * (length-1))];
                let ep = new EndpointRef();
                ep.method = request.header.endpoint.method;
                ep.endpoint = new DatabaseEndpoint("/shard")
                newRequest.header = {
                    protocol: Protocol.HTTP,
                    endpoint: ep
                };
                newRequest.data = {};
                newRequest.origin = conn;
                newRequest.originID = this.originID;
                newRequest.requestId = UUID();
                this.connectionTable[newRequest.requestId] = newRequest.origin;
                await this.outputPort.sendData(newRequest, conn);
            }
        }
        this.connectionTable[request.requestId] = request.origin;
        let response = new RequestData();
        response.header = {
            protocol: Protocol.HTTP,
            endpoint: request.header.endpoint,
        };
        response.data = {};
        response.origin = request.origin;
        response.originID = this.originID;
        response.requestId = UUID();
        response.responseId = request.requestId;
        await this.sendData(response);
    }

    private receiveDataDispatcher = new EventDispatcher<ReceiveDataEvent>();
    public onReceiveData(handler: Handler<ReceiveDataEvent>) {
        this.receiveDataDispatcher.register(handler);
    }
    private fireReceiveData(event: ReceiveDataEvent) { 
        this.receiveDataDispatcher.fire(event);
    }

    private showStatusCodeDispatcher = new EventDispatcher<ShowStatusCodeEvent>();
    public onShowStatusCode(handler: Handler<ShowStatusCodeEvent>) {
        this.showStatusCodeDispatcher.register(handler);
    }
    private fireShowStatusCode(event: ShowStatusCodeEvent) { 
        this.showStatusCodeDispatcher.fire(event);
    }

    async sendData(response: RequestData) {
        let targetConnection = this.connectionTable[response.responseId]
        if(targetConnection == null){
            throw new Error("Target connection can not be null");
        }
        this.connectionTable[response.responseId] = null; // reset request id
        await this.inputPort.sendData(response, targetConnection);
    }

    connectTo(operator: IDataOperator, connectingWithOutput:boolean, connectingToOutput:boolean) : Connection{
        if(connectingWithOutput){
            return this.outputPort.connectTo(operator.getPort(connectingToOutput));
        }
        else{
            return this.inputPort.connectTo(operator.getPort(connectingToOutput));
        }
    }

    getPort(outputPort:boolean=false) : Port {
        return outputPort ? this.outputPort : this.inputPort;
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