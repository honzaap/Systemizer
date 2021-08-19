import { IDataOperator } from "src/interfaces/IDataOperator";
import { arrayEquals, getRateFromOutputRate, sleep, UUID } from "src/shared/ExtensionMethods";
import { Connection } from "./Connection";
import { Endpoint, EndpointRef } from "./Endpoint";
import { gRPCMode } from "./enums/gRPCMode";
import { Protocol } from "./enums/Protocol";
import { LogicComponent } from "./LogicComponent";
import { Options } from "./Options";
import { Port } from "./Port";
import { RequestData, RequestDataHeader } from "./RequestData";

export class ClientCluster extends LogicComponent implements IDataOperator{

    outputPort: Port;
    options: ClientClusterOptions;
    streamingConnections: StreamingConnection[] = [];
    isSendingData: boolean;
    color = "#2ebf91";

    constructor() {
        super();
        this.outputPort = new Port(this, true, true);        
        this.options = new ClientClusterOptions();
        this.options.title = "Client Cluster";
    }

    receiveData(data: RequestData): void {
        this.fireReceiveData(data);
        if(data.header.endpoint.endpoint.protocol == Protocol.WebSockets || data.header.endpoint.endpoint.grpcMode == gRPCMode["Bidirectional Streaming"] || data.header.endpoint.endpoint.grpcMode == gRPCMode["Server Streaming"]){
            if(data.header.stream != true){ // Disconnect from stream
                let streamConnection = this.streamingConnections.find(con => con.connectionId === data.responseId);
                if(streamConnection != null)
                    this.streamingConnections.splice(this.streamingConnections.findIndex(con => con.connectionId === data.responseId), 1);
            }
        }
    }

    /**
     * Starts sending data to random available endpoints
     */
    startSendingData(){
        this.isSendingData = true;    
        this.sendNewRequest();
    }

    stopSendingData(){
        for(let streamConnection of this.streamingConnections){
            this.stopStream(streamConnection.connectionId);
        }
        this.streamingConnections = [];
        this.isSendingData = false;
    }

    async sendNewRequest(){
        await sleep( (1 / getRateFromOutputRate(this.options.outputRate)) * 1000 )
        if(!this.isSendingData)
            return;
        this.sendNewRequest();
        if(this.outputPort.connections.length == 0)
            return;
        let connection = this.outputPort.connections[Math.floor(Math.random() * this.outputPort.connections.length)];
        let endpoints = connection.getOtherPort(this.outputPort).parent.getAvailableEndpoints();
        if(endpoints.length == 0)
            return;
        let targetEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        let request = new RequestData();
        request.origin = connection;
        request.originID = this.originID;
        request.requestId = UUID();
        let epRef = new EndpointRef();
        epRef.endpoint = targetEndpoint;
        epRef.method = targetEndpoint.supportedMethods[Math.floor(Math.random() * targetEndpoint.supportedMethods.length)];
        request.header = new RequestDataHeader(epRef, targetEndpoint.protocol);
        if(targetEndpoint.grpcMode != gRPCMode.Unary || targetEndpoint.protocol == Protocol.WebSockets){ 
            // Stream endpoint 
            let streamConnection = this.streamingConnections.find(con => con.endpoint === targetEndpoint);
            if(streamConnection != null){ 
                // Already streaming to this connection -> end stream
                this.stopStream(streamConnection.connectionId);
                this.streamingConnections.splice(this.streamingConnections.findIndex(con => con.connectionId == streamConnection.connectionId), 1);
            }
            else{ 
                // Estabilish new stream to given connection 
                this.streamingConnections.push(new StreamingConnection(request.requestId, targetEndpoint, connection));
                this.stream(request, request.requestId);
            }
        }
        else{ 
            // Basic endpoint
            this.sendData(request);
        }
    }

    async sendData(data: RequestData) {
        return await this.outputPort.sendData(data, data.origin);
    }

    getAvailableEndpoints(): Endpoint[] {
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

    stopStream(connectionId){
        let streamConnection = this.streamingConnections.find(con => con.connectionId == connectionId);
        if(streamConnection == null || streamConnection.endpoint.grpcMode == gRPCMode.Unary && streamConnection.endpoint.protocol != Protocol.WebSockets)
            return;
        let data = new RequestData();
        let epRef = new EndpointRef();
        epRef.endpoint = streamConnection.endpoint;
        epRef.method = epRef.endpoint.supportedMethods[Math.floor(Math.random() * epRef.endpoint.supportedMethods.length)];
        data.header = new RequestDataHeader(epRef, epRef.endpoint.protocol, false);
        data.requestId = connectionId;
        data.origin = streamConnection.connection;
        data.originID = this.originID;
        this.sendData(data);
    }

    async stream(data: RequestData, connectionId: string){
        let streamConnection = this.streamingConnections.find(con => con.connectionId == connectionId);
        if(!this.isSendingData || streamConnection == null || streamConnection.endpoint.grpcMode == gRPCMode.Unary && streamConnection.endpoint.protocol != Protocol.WebSockets)
            return;
        data.requestId = connectionId;
        data.origin = streamConnection.connection;
        data.header.stream = true;
        this.sendData(data);
        await sleep(700);
        await this.stream(data, connectionId);
    }
}

export class ClientClusterOptions extends Options{
    outputRate: number = 5;
}

class StreamingConnection {
    connectionId: string ;
	endpoint: Endpoint ;
	connection: Connection;

    constructor(connectionId: string, endpoint: Endpoint, connection: Connection) {
        this.connectionId = connectionId;
        this.connection = connection;
        this.endpoint = endpoint;
    }
}