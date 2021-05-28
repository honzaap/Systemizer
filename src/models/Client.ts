import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Options } from "./Options";
import { Port } from "./Port";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";
import { Protocol } from "./enums/Protocol";
import { HTTPMethod } from "./enums/HTTPMethod";
import { Endpoint, EndpointRef } from "./Endpoint";
import { arrayEquals, UUID } from "src/shared/ExtensionMethods";
import { gRPCMode } from "./enums/gRPCMode";



interface ReceiveDataEvent { }

export class Client implements IDataOperator{

    port: Port;
    options: ClientOptions;
    originID: string;

    constructor() {
        this.port = new Port(this);        
        this.options = new ClientOptions();
        this.options.title = "Client";
        this.originID = UUID();
    }

    receiveData(data: RequestData): void {
        //console.log("Client got data: ",data);
        if(data.header.endpoint.endpoint.protocol == Protocol.WebSockets || data.header.endpoint.endpoint.grpcMode == gRPCMode["Bidirectional Streaming"] || data.header.endpoint.endpoint.grpcMode == gRPCMode["Server Streaming"]){
            if(data.header.stream == true){
                if(this.options.connectedId == null) return;
                this.options.isConnectedToEndpoint = true;
            }
            else{
                this.options.isConnectedToEndpoint = false;
                this.options.connectedId = null;
            }

        }
        this.fireReceiveData(data);
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

    async sendData(data: RequestData) {
        this.updateEndpoint();
        return await this.port.sendData(data);
    }

    connectTo(operator: IDataOperator, connectingWithOutput:boolean, connectingToOutput:boolean) : Connection{
        return this.port.connectTo(operator.getPort(connectingToOutput));
    }

    getPort(outputPort:boolean=false) : Port {
        return this.port;
    }
    
    getAvailableEndpoints(): Endpoint[]
    {
        let endpoints :Endpoint[] = [];
        for(let connection of this.port.connections){
            connection.getOtherPort(this.port).parent.getAvailableEndpoints().forEach(x=>{
                let has = false;
                for(let y of endpoints){
                    if(y.url===x.url &&  arrayEquals(x.supportedMethods,y.supportedMethods)){
                        has = true;
                        break;
                    } 
                }
                if(!has)endpoints.push(x);
            });        
        }
        return endpoints;
    }

    updateEndpoint(){
        let availableEndpoints = this.getAvailableEndpoints();
        if(this.options.endpointRef.endpoint == null){
            if(availableEndpoints.length == 0) return;
            this.options.endpointRef.endpoint = availableEndpoints[0];
            this.options.endpointRef.method = availableEndpoints[0].supportedMethods[0];
        }
        else{
            let was = false;
            for(let endpoint of availableEndpoints){
                if(this.options.endpointRef.endpoint === endpoint){
                    was = true;
                }
            }
            if(!was){
                if(availableEndpoints.length == 0) return;
                this.options.endpointRef.endpoint = availableEndpoints[0];
                this.options.endpointRef.method = availableEndpoints[0].supportedMethods[0];
            }
        }
    }

    destroy(){
        this.port.removeConnections();
    }
}

export class ClientOptions extends Options{
    data: RequestData;
    protocol: Protocol = Protocol.HTTP; // Is decided by endpoint, cannot be changed from client
    endpointRef: EndpointRef = new EndpointRef();
    isConnectedToEndpoint: boolean = false; // For streaming/websockets
    connectedId: string;
}