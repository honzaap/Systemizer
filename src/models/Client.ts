import { IDataOperator } from "src/interfaces/IDataOperator";
import { arrayEquals } from "src/shared/ExtensionMethods";
import { Endpoint, EndpointRef } from "./Endpoint";
import { gRPCMode } from "./enums/gRPCMode";
import { Protocol } from "./enums/Protocol";
import { LogicComponent } from "./LogicComponent";
import { Options } from "./Options";
import { Port } from "./Port";
import { RequestData } from "./RequestData";

export class Client extends LogicComponent implements IDataOperator{

    outputPort: Port;
    options: ClientOptions;
    originID: string;

    constructor() {
        super();
        this.outputPort = new Port(this, true, false);        
        this.options = new ClientOptions();
        this.options.title = "Client";
    }

    receiveData(data: RequestData): void {
        this.fireReceiveData(data);
        if(data.header.endpoint.endpoint.protocol == Protocol.WebSockets || data.header.endpoint.endpoint.grpcMode == gRPCMode["Bidirectional Streaming"] || data.header.endpoint.endpoint.grpcMode == gRPCMode["Server Streaming"]){
            if(data.header.stream == true){
                if(this.options.connectedId == null) 
                    return;
                this.options.isConnectedToEndpoint = true;
            }
            else{
                this.options.isConnectedToEndpoint = false;
                this.options.connectedId = null;
            }
        }
    }

    onConnectionUpdate(wasOutput: boolean = false){}

    async sendData(data: RequestData) {
        this.updateEndpoint();
        return await this.outputPort.sendData(data);
    }

    getAvailableEndpoints(): Endpoint[]
    {
        let availableEndpoints :Endpoint[] = [];
        for(let connection of this.outputPort.connections){
            connection.getOtherPort(this.outputPort).parent.getAvailableEndpoints().forEach(endpoint =>{
                let duplicate = (availableEndpoints.find(ep => ep.url === endpoint.url && arrayEquals(endpoint.supportedMethods, ep.supportedMethods)) != null)
                if(!duplicate)
                    availableEndpoints.push(endpoint);
            });        
        }
        return availableEndpoints;
    }

    updateEndpoint(){
        let availableEndpoints = this.getAvailableEndpoints();
        if(this.options.endpointRef.endpoint == null){ // Set default endpoint if available
            if(availableEndpoints.length == 0) 
                return;
            this.options.endpointRef.endpoint = availableEndpoints[0];
            this.options.endpointRef.method = availableEndpoints[0].supportedMethods[0];
        }
        else{
            let isAvailable = false;
            for(let endpoint of availableEndpoints){
                if(this.options.endpointRef.endpoint === endpoint){
                    isAvailable = true;
                    break;
                }
            }
            if(!isAvailable){ // If current endpoint is no longer available, replace it
                if(availableEndpoints.length == 0) 
                    return;
                this.options.endpointRef.endpoint = availableEndpoints[0];
                this.options.endpointRef.method = availableEndpoints[0].supportedMethods[0];
            }
        }
    }

    destroy(){
        this.outputPort.removeConnections();
    }
}

export class ClientOptions extends Options{
    data: RequestData;
    protocol: Protocol = Protocol.HTTP; // Is decided by endpoint, cannot be changed from client
    endpointRef: EndpointRef = new EndpointRef();
    isConnectedToEndpoint: boolean = false; // For streaming/websockets
    connectedId: string;
}