import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Options } from "./Options";
import { Port } from "./Port";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";
import { UUID } from "src/shared/ExtensionMethods";
import { Protocol } from "./enums/Protocol";
import { Endpoint, EndpointRef } from "./Endpoint";
import { HTTPMethod } from "./enums/HTTPMethod";
import { HTTPStatus } from "./enums/HTTPStatus";
import { EndpointOperator, EndpointOptions } from "./EdpointOperator";
import { ReplacementPolicy } from "./enums/ReplacementPolicy";
import { WritePolicy } from "./enums/WritePolicy";

interface ReceiveDataEvent { }

export class Cache implements IDataOperator{

    inputPort: Port;
    outputPort: Port
    options: CacheOptions;
    connectionTable: {[id:string]:Connection} = {};
    originID: string;

    constructor() {
        this.inputPort = new Port(this,false,true);      
        this.outputPort = new Port(this,true,false);      
        this.options = new CacheOptions();  
        this.options.title = "Cache";
        this.originID = UUID();
    }

    async receiveData(request: RequestData, fromOutput = false) {
        if(fromOutput){
            let targetConnection = this.connectionTable[request.responseId]
            if(targetConnection == null) return; 
            await this.sendData(request);
        }
        else{
            this.fireReceiveData(request);
            if(request.header.endpoint == null) return;
            this.connectionTable[request.requestId] = request.origin;
            if(request.header.endpoint.method == HTTPMethod.GET){
                let cacheHit = Math.random() > 0.43 ? true : false;
                if(cacheHit){
                    let response = new RequestData();
                    response.responseId = request.requestId;
                    response.requestId = UUID();
                    response.origin = request.origin;
                    response.originID = this.originID;
                    response.header = {
                        endpoint: request.header.endpoint,
                        protocol: request.header.protocol
                    };
                    response.data = {hit: true};
                    this.fireShowStatusCode(HTTPStatus["Cache Hit"])
                    await this.sendData(response);
                    return;
                }
                this.fireShowStatusCode(HTTPStatus["Cache Miss"])
            }
            switch(this.options.writePolicy){
                case WritePolicy["Write-Through"]:
                    await this.writeThrough(request);
                    break;
                case WritePolicy["Write-Back (Behind)"]:
                    await this.writeBack(request);
                    break;
                default:
                    await this.writeThrough(request);
                    break;            
            }
        }
    }

    async writeThrough(data: RequestData){
        // write to cache, then database, if both succeeded, return success
        if(this.outputPort.connections.length == 0) return;
        data.origin = this.outputPort.connections[0];
        data.originID = this.originID;
        // Write to cache

        // Send to DB
        await this.outputPort.sendData(data);
    }


    async writeBack(data: RequestData){
        // write to cache, send success, write asynchronously to database
        if(this.outputPort.connections.length == 0) return;
        data.origin = this.outputPort.connections[0];
        data.originID = this.originID;
        // Write to cache

        // Send to DB
        this.outputPort.sendData(data);

        // Create new response
        let response = new RequestData();
        response.data = {}
        response.requestId = UUID();
        response.responseId = data.requestId;
        response.header = {
            endpoint: data.header.endpoint,
            protocol: data.header.protocol
        };
        response.originID = this.originID;
        response.origin = this.connectionTable[data.requestId];

        await this.sendData(response)
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
        if(this.outputPort.connections.length > 0){
            return this.outputPort.connections[0].getOtherPort(this.outputPort).parent.getAvailableEndpoints();
        }
        return [];
    }

    destroy(){
        this.inputPort.removeConnections();
        this.outputPort.removeConnections();
    }
}

export class CacheOptions extends Options {
    replacementPolicy: ReplacementPolicy = ReplacementPolicy["Least Frequently Used"];
    writePolicy: WritePolicy = WritePolicy["Write-Through"];
}