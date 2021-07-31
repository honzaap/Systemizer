import { IDataOperator } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData, RequestDataHeader } from "./RequestData";
import { Options } from "./Options";
import { Port } from "./Port";
import { UUID } from "src/shared/ExtensionMethods";
import { Endpoint } from "./Endpoint";
import { HTTPMethod } from "./enums/HTTPMethod";
import { HTTPStatus } from "./enums/HTTPStatus";
import { ReplacementPolicy } from "./enums/ReplacementPolicy";
import { WritePolicy } from "./enums/WritePolicy";
import { LogicComponent } from "./LogicComponent";
import { Database } from "./Database";

export class Cache extends LogicComponent implements IDataOperator{

    inputPort: Port;
    outputPort: Port
    options: CacheOptions;
    connectionTable: { [id:string]: Connection } = {};
    color = "#b21f1f";

    constructor() {
        super();
        this.inputPort = new Port(this,false,true);      
        this.outputPort = new Port(this,true,false);      
        this.options = new CacheOptions();  
        this.options.title = "Cache";
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
            if(request.header.endpoint.method == HTTPMethod.GET){ // Client wants to write
                let cacheHit = Math.random() > 0.43 ? true : false; // Random chance of cache hit
                if(cacheHit){
                    let response = new RequestData();
                    response.responseId = request.requestId;
                    response.requestId = UUID();
                    response.origin = request.origin;
                    response.originID = this.originID;
                    response.header = new RequestDataHeader(request.header.endpoint, request.header.protocol);
                    this.fireShowStatusCode(HTTPStatus["Cache Hit"])
                    await this.sendData(response);
                    return;
                }
                this.fireShowStatusCode(HTTPStatus["Cache Miss"])
            }

            if(this.outputPort.connections.length == 0) 
                return;

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
        data.origin = this.outputPort.connections[0];
        data.originID = this.originID;
        // Write to cache

        // Send to DB
        await this.outputPort.sendData(data);
    }


    async writeBack(data: RequestData){
        // write to cache, send success, write asynchronously to database
        data.origin = this.outputPort.connections[0];
        data.originID = this.originID;
        // Write to cache

        // Send to DB
        if(data.header.endpoint.method == HTTPMethod.GET)
            await this.outputPort.sendData(data);
        else{
            this.outputPort.sendData(data);
            data.responseId = data.requestId;
            data.requestId = UUID();
            await this.sendData(data);
        }
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
        // Output of cache can connect only to database
        if(!connectingWithOutput)
            return true;
        if(port.parent instanceof Database)
            return true;
        this.fireFailedConnect({message: "Output of Cache can only be connected to Database."});
        return false;
    }

    getAvailableEndpoints(): Endpoint[]
    {
        if(this.outputPort.connections.length > 0)
            return this.outputPort.connections[0].getOtherPort(this.outputPort).parent.getAvailableEndpoints();
        return [];
    }
}

export class CacheOptions extends Options {
    replacementPolicy: ReplacementPolicy = ReplacementPolicy["Least Frequently Used"];
    writePolicy: WritePolicy = WritePolicy["Write-Through"];
}