import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData, RequestDataHeader } from "./RequestData";
import { Port } from "./Port";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";
import { arrayEquals, sleep, UUID } from "src/shared/ExtensionMethods";
import { Endpoint, EndpointRef } from "./Endpoint";
import { EndpointOperator, EndpointOptions } from "./EdpointOperator";
import { Protocol } from "./enums/Protocol";
import { EndpointActionHTTPMethod, HTTPMethod } from "./enums/HTTPMethod";
import { HTTPStatus } from "./enums/HTTPStatus";
import { APIType } from "./enums/APIType";
import { gRPCMode } from "./enums/gRPCMode";
import { MessageQueue } from "./MessageQueue";
import { PubSub } from "./PubSub";

interface ReceiveDataEvent { }

export class API extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    connectionTable: { [id:string]: Connection } = {};
    options: APIOptions;
    originID: string;

    constructor() {
        super();
        this.inputPort = new Port(this, false, true);        
        this.outputPort = new Port(this, true, true);       
        this.options = new APIOptions(); 
        this.options.title = "API";
        this.originID = UUID();
        let initialEndpoint = new Endpoint("api/posts", [HTTPMethod.GET,HTTPMethod.POST,HTTPMethod.PUT,HTTPMethod.DELETE,])
        initialEndpoint.protocol = Protocol.HTTP;
        this.options.endpoints = [
            initialEndpoint
        ];
    }

    async receiveData(data: RequestData, fromOutput:boolean) {
        if(fromOutput){
            let targetConnection = this.connectionTable[data.responseId]
            if(targetConnection == null) throw new Error("Target connection can not be null")
            this.connectionTable[data.responseId] = null; // reset request id
            this.fireReceiveData(data);
            // API received data from action 
        }
        else{
            // Null check
            if(data.requestId == "" || data.requestId == null) throw new Error("Request ID can not be null");
            if(data.header.endpoint == null) throw new Error("Endpoint can not be null")

            // Checking for 404 and 405
            let hasEndpoint = false;
            let notAllowed = false;
            let targetEndpoint: Endpoint;
            let targetUrl = data.header.endpoint.endpoint.url;

            this.options.endpoints.filter(endpoint => 
                endpoint.url == targetUrl
            ).forEach(endpoint => {
                hasEndpoint = true;
                if(endpoint.supportedMethods.indexOf(data.header.endpoint.method) == -1)
                    notAllowed = true;
                else{
                    // Found wanted endpoint
                    notAllowed = false;
                    targetEndpoint = endpoint;
                    return;
                }
            })

            if(!hasEndpoint){
                this.fireShowStatusCode(HTTPStatus["Not Found"])
                return;
            }
            if(notAllowed){
                this.fireShowStatusCode(HTTPStatus["Method Not Allowed"]);
                return;
            }

            this.fireReceiveData(data);
            if(this.connectionTable[data.requestId] != null){ // Check if the api is already streaming to this connection
                // Client sent data to stream
                if(data.header.stream == false) // Client wants to end stream
                    this.connectionTable[data.requestId] = null;

                return;
            }
            else{
                this.connectionTable[data.requestId] = data.origin; // Save connection to request package
                if(data.header.stream){
                    if(targetEndpoint.grpcMode != gRPCMode.Unary || targetEndpoint.protocol == Protocol.WebSockets){
                        // Client wants to strat stream
                        let response = new RequestData();
                        response.header = new RequestDataHeader(data.header.endpoint, targetEndpoint.protocol, true);
                        response.origin = data.origin;
                        response.originID = this.originID;
                        response.responseId = data.requestId;
                        this.stream(response, targetEndpoint);
                    }
                    return;
                }
            }

            // Send data to every action
            for(let action of targetEndpoint.actions){
                // Get connection to given action endpoint
                let targetConnection: Connection;

                for(let connection of this.outputPort.connections){
                    let endpoints = connection.getOtherPort(this.outputPort).parent.getAvailableEndpoints();
                    if(endpoints.find(endpoint => endpoint.url == action.endpoint.url && arrayEquals(endpoint.supportedMethods,action.endpoint.supportedMethods)) != null ){
                        targetConnection = connection;
                        break;
                    }
                }
                if(targetConnection == null)
                    continue;
                // Create new data package
                let request = new RequestData();
                let endpointRef = new EndpointRef();
                endpointRef.endpoint = action.endpoint;
                endpointRef.method = EndpointActionHTTPMethod[action.method] == "Inherit" ? data.header.endpoint.method : HTTPMethod[EndpointActionHTTPMethod[action.method]]
                request.header = new RequestDataHeader(endpointRef,action.endpoint.protocol);

                request.origin = targetConnection;
                request.originID = this.originID;
                request.requestId = UUID();

                this.connectionTable[request.requestId] = request.origin;

                await this.outputPort.sendData(request, targetConnection);
            }

            // Send response back to client
            if(!this.options.isConsumer){
                let response = new RequestData();
                response.header = new RequestDataHeader(data.header.endpoint,targetEndpoint.protocol);

                response.origin = data.origin;
                response.originID = this.originID;
                response.requestId = UUID();
                response.responseId = data.requestId;
                await this.sendData(response);
            }
        }
    }

    initiateConsumer(consumerConnection: Connection, subscriber = false){
        // Remove every connetcion that is not publisher/consumer
        let bad_connection_indexes = []
        for(let i = this.inputPort.connections.length-1; i >= 0; i--){
            let connection = this.inputPort.connections[i];
            if(!this.isConsumableOperator(connection.getOtherPort(this.inputPort).parent)) 
                bad_connection_indexes.push(i);
        }
        for(let i of bad_connection_indexes)
            this.inputPort.connections.splice(i, 1);

        let endpoints = (consumerConnection.getOtherPort(this.inputPort).parent.options as EndpointOptions).endpoints;
        if(subscriber){
            if(endpoints.length != 0){
                if(this.options.isConsumer)
                    this.options.endpoints.push(new Endpoint(endpoints[0].url, [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.PATCH, HTTPMethod.DELETE]));
                else
                    this.options.endpoints = [ new Endpoint(endpoints[0].url, [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.PATCH, HTTPMethod.DELETE])];
            }
            else if(endpoints.length == 0 && !this.options.isConsumer)
                this.options.endpoints = [];
        }
        else{
            if(this.options.isConsumer)
                this.options.endpoints.push(endpoints[0]);
            else
                this.options.endpoints = [endpoints[0]];
        }
        this.options.isConsumer = true;
        if(subscriber) this.options.isSubscriber = true;
    }

    onConnectionUpdate(wasOutput: boolean = false){
        // Remove consumer connection if the API is no longer a consumer
        if(this.options.isConsumer && !this.isConsumer()){
            let conns = this.inputPort.connections.filter(c => this.isConsumableOperator(c.getOtherPort(this.inputPort).parent))
            for(let connection of conns)
                this.inputPort.removeConnection(connection,true,false);
            this.options.isConsumer = false;
            this.options.isSubscriber = false;
            let ep = new Endpoint("api/posts", [HTTPMethod.GET,HTTPMethod.POST,HTTPMethod.PUT,HTTPMethod.DELETE,])
            ep.protocol = Protocol.HTTP;
            this.options.endpoints = [
                ep
            ]
        }
    }

    isConsumer(): boolean{
        if(this.inputPort.connections.length == 0)
            return this.options.isConsumer;
        for(let conn of this.inputPort.connections){
            if(!this.isConsumableOperator(conn.getOtherPort(this.inputPort).parent))
                return false;
        }
        return true;
    }

    async sendData(response: RequestData) {
        let targetConnection = this.connectionTable[response.responseId]
        if(targetConnection == null)
            throw new Error("target connection is null");
        if(response.header.stream != true) // reset request id
            this.connectionTable[response.responseId] = null; 
        let res = await this.inputPort.sendData(response, targetConnection);
        if(!res && response.header.stream) // End the stream if sending data didn't success
            this.connectionTable[response.responseId] = null;
    }

    async stream(data: RequestData, streamingEndpoint: Endpoint){
        await sleep(700);
        if(this.connectionTable[data.responseId] == null ||(
            streamingEndpoint.grpcMode != gRPCMode["Server Streaming"] &&
            streamingEndpoint.grpcMode != gRPCMode["Bidirectional Streaming"] && 
            streamingEndpoint.protocol != Protocol.WebSockets) ||
            this.options.endpoints.indexOf(streamingEndpoint) == -1) return;
        await this.sendData(data);
        await this.stream(data, streamingEndpoint);
    }

    connectTo(operator: IDataOperator, connectingWithOutput:boolean, connectingToOutput:boolean) : Connection{
        if(connectingWithOutput)
            return this.outputPort.connectTo(operator.getPort(connectingToOutput));
        let conn = this.inputPort.connectTo(operator.getPort(connectingToOutput));
        if(conn != null && this.isConsumableOperator(operator))
            this.initiateConsumer(conn, operator instanceof PubSub);
        return conn;
    }

    getSubscribeableEndpoints(): Endpoint[]{
        let endpoints = [];
        for(let connection of this.inputPort.connections){
            let operator = connection.getOtherPort(this.inputPort).parent;
            if(operator instanceof PubSub){
                for(let endpoint of operator.options.endpoints){
                    if(endpoints.filter(ep => ep.url == endpoint.url).length == 0){
                        endpoints.push(endpoint);
                    }
                }
            }
        }
        return endpoints;
    }

    isConsumableOperator(operator: IDataOperator): boolean{
        return operator instanceof MessageQueue || operator instanceof PubSub;
    }

    getPort(outputPort:boolean=false): Port {
        if(outputPort)
            return this.outputPort;
        return this.inputPort;
    }

    getAvailableEndpoints(): Endpoint[]{
        return this.options.endpoints;
    }

    destroy(){
        this.inputPort.removeConnections();
        this.outputPort.removeConnections();
    }
}

export class APIOptions extends EndpointOptions{
    type: APIType = APIType.REST
    isConsumer = false;
    isSubscriber = false;
}