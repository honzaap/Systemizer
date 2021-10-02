import * as objectHash from 'object-hash';
import { IDataOperator } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { Endpoint } from "./Endpoint";
import { LogicComponent } from "./LogicComponent";
import { Options } from "./Options";
import { Port } from "./Port";
import { RequestData } from "./RequestData";

export class Proxy extends LogicComponent implements IDataOperator{
    inputPort: Port;
    outputPort: Port;
    connectionTable: {[id:string]:Connection} = {};
    streamConnectionTable: { [id:string]:Connection } = {};
    options: ProxyOptions;
    fillColor = false;
    color = "#283c86";

    constructor() {
        super();
        this.inputPort = new Port(this, false, true);        
        this.outputPort = new Port(this, true, true);        
        this.options = new ProxyOptions();
        this.options.title = "Proxy";
    }

    async receiveData(data: RequestData, fromOutput:boolean) {
        if(fromOutput){
            let targetConnection = this.connectionTable[data.responseId];
            if(targetConnection == null)
                throw new Error("Connection doesn't exist (response to unknown request)");
            if(data.header.stream != true) {
                this.connectionTable[data.responseId] = null;  // reset request id
                this.streamConnectionTable[data.responseId] = null;
            }
            this.fireReceiveData(data);
            let result = await this.inputPort.sendData(data,targetConnection);
            if(!result && data.header.stream){
                data.header.stream = false;
                data.requestId = data.responseId;
                data.responseId = null;
                let res = this.outputPort.sendData(data,data.origin);
                if(res){
                    this.connectionTable[data.responseId] = null;
                    this.streamConnectionTable[data.responseId] = null;
                }
            }
        }
        else{
            if(data.requestId == null )
                throw new Error("requestId can not be null.");

            this.fireReceiveData(data);

            if(this.streamConnectionTable[data.requestId] != null){
                data.origin = this.streamConnectionTable[data.requestId];
                data.originID = this.originID;
                await this.outputPort.sendData(data,this.streamConnectionTable[data.requestId]);
                return;
            }

            this.connectionTable[data.requestId] = data.origin;

            // Find connection that has given endpoint
            let targetEndpoint = null;
            let targetConnection = null;
            for(let connection of this.outputPort.connections){
                targetEndpoint = connection.getOtherPort(this.outputPort).parent
                    .getAvailableEndpoints().find(ep => ep.url === data.header.endpoint.endpoint.url);
                if(targetEndpoint){
                    targetConnection = connection;
                    break;
                }
            }
            if(targetEndpoint == null){
                this.fireShowStatusCode(404);
                return;
            }
            data.origin = targetConnection;
            data.originID = this.originID;
            this.streamConnectionTable[data.requestId] = data.origin;
            await this.outputPort.sendData(data,data.origin);
        }
    }

    /**
     * 
     * Proxy can't send data on its own
     */
    sendData(request: RequestData): void {}

    getAvailableEndpoints(): Endpoint[]{
       let connectableEndpoints :Endpoint[] = [];
        for(let connection of this.outputPort.connections){
            connection.getOtherPort(this.outputPort).parent.getAvailableEndpoints().forEach(endpoint =>{
                let duplicate = (connectableEndpoints.find(ep => ep.url === endpoint.url) != null)
                if(!duplicate)
                    connectableEndpoints.push(endpoint);
            });        
        }
        return connectableEndpoints;
    }
}

export class ProxyOptions extends Options{
}

