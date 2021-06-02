import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Options } from "./Options";
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

interface ReceiveDataEvent { }

export class APIGateway extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    connectionTable: {[id:string]:Connection} = {};
    options: APIGatewayOptions;
    originID: string;

    constructor() {
        super()
        this.inputPort = new Port(this, false, true);        
        this.outputPort = new Port(this, true, true);       
        this.options = new APIGatewayOptions(); 
        this.options.title = "API Gateway";
        this.originID = UUID();
    }

    async receiveData(data: RequestData, fromOutput:boolean) {
        if(fromOutput){
            let targetConnection = this.connectionTable[data.responseId]
            if(targetConnection == null) return; // connection could be ended before last data was sent
            // Checking if endpoint wasn't removed before stream end
            if(data.header.stream){
                let was = false;
                for(let endpoint of this.getEndpoints()){
                    for(let action of endpoint.actions){
                        if(action.endpoint.url === data.header.endpoint.endpoint.url && 
                        action.endpoint.protocol === data.header.endpoint.endpoint.protocol &&
                        arrayEquals(action.endpoint.supportedMethods, data.header.endpoint.endpoint.supportedMethods)){
                            was = true;
                        }
                    }
                }
                if(!was){
                    data.header.stream = false;
                    //this.inputPort.sendData(data,targetConnection);
                    data.requestId = data.responseId;
                    data.responseId = null;
                    let res = this.outputPort.sendData(data,data.origin)
                    if(res){
                        this.connectionTable[data.responseId] = null;
                    }
                    return;
                }
            }
            this.fireReceiveData(data);
            if(data.header.stream){
                let res = await this.inputPort.sendData(data, this.connectionTable[data.responseId]);
                if(!res && data.header.stream){
                    data.header.stream = false;
                    data.requestId = data.responseId;
                    data.responseId = null;
                    let res = this.outputPort.sendData(data,data.origin)
                    if(res){
                        this.connectionTable[data.responseId] = null;
                    }
                }
            }
            else{
                if(data.header.endpoint.endpoint.protocol == Protocol.WebSockets || data.header.endpoint.endpoint.grpcMode == gRPCMode["Bidirectional Streaming"] || data.header.endpoint.endpoint.grpcMode == gRPCMode["Server Streaming"]){
                    await this.inputPort.sendData(data, this.connectionTable[data.responseId]);
                }
                else{
                }
            }
        }
        else{
            if(data.requestId == "" || data.requestId == null) throw new Error("Request ID can not be null");
            if(data.header.endpoint == null) throw new Error("Endpoint can not be null")

            // Checking for 404 and 405
            let was = false;
            let notAllowed = false;
            let targetEndpoint: Endpoint;
            for(let endpoint of this.getEndpoints()){
                if(endpoint.url === data.header.endpoint.endpoint.url){
                    was = true;
                    if(endpoint.supportedMethods.indexOf(data.header.endpoint.method) == -1) notAllowed = true;
                    else{
                        notAllowed = false;
                        targetEndpoint = endpoint;
                        break;
                    }
                }
            }
            if(!was){
                this.fireShowStatusCode(HTTPStatus["Not Found"])
                return;
            }
            if(notAllowed){
                this.fireShowStatusCode(HTTPStatus["Method Not Allowed"]);
                return;
            }

            this.fireReceiveData(data);
            let sendResponse = false;
            let isFirstStreamRequest = this.connectionTable[data.requestId] == null && data.header.stream;
            let isLastStreamRequest = this.connectionTable[data.requestId] != null && !data.header.stream;
            let dontSendRequestResponse = (isFirstStreamRequest || isLastStreamRequest);
            for(let action of targetEndpoint.actions){
                // Get connection to given action endpoint
                if(action.endpoint == null || action.endpoint.url == null){
                    continue;
                }
                let targetConnection: Connection;
                let has = false;
                for(let connection of this.outputPort.connections){
                    for(let x of connection.getOtherPort(this.outputPort).parent.getAvailableEndpoints()){
                        if(has) break;
                        if(action.endpoint.url===x.url &&  arrayEquals(x.supportedMethods,action.endpoint.supportedMethods)){
                            has = true;
                            targetConnection = connection;
                        } 
                    }      
                    if(has) break;
                }
                if(targetConnection == null) continue;

                if(data.header.stream){
                    if(action.endpoint.protocol == Protocol.WebSockets || 
                    action.endpoint.grpcMode != gRPCMode.Unary){
                        if(action.endpoint.grpcMode == gRPCMode["Server Streaming"] && !dontSendRequestResponse) continue;
                        this.connectionTable[data.requestId] = data.origin;
                        let request = new RequestData();
                        let epRef = new EndpointRef();
                        epRef.endpoint = action.endpoint;
                        epRef.method = EndpointActionHTTPMethod[action.method] == "Inherit" ? data.header.endpoint.method : HTTPMethod[EndpointActionHTTPMethod[action.method]]
                        request.header = {
                            protocol: action.endpoint.protocol,
                            endpoint: epRef,
                            stream: data.header.stream 
                        };
                        request.data = {};
                        request.origin = targetConnection;
                        request.originID = this.originID;
                        request.requestId = data.requestId;
                        this.outputPort.sendData(request, targetConnection);
                    }
                    else{
                        if(dontSendRequestResponse) continue;
                        this.connectionTable[data.requestId] = data.origin;
                        let request = new RequestData();
                        let epRef = new EndpointRef();
                        epRef.endpoint = action.endpoint;
                        epRef.method = EndpointActionHTTPMethod[action.method] == "Inherit" ? data.header.endpoint.method : HTTPMethod[EndpointActionHTTPMethod[action.method]]
                        request.header = {
                            protocol: action.endpoint.protocol,
                            endpoint: epRef,
                            stream: data.header.stream 
                        };
                        request.data = {};
                        request.origin = targetConnection;
                        request.originID = this.originID;
                        request.requestId = data.requestId;
                        sendResponse = true;
                        await this.outputPort.sendData(request, targetConnection);
                    }
                }
                else{
                    if(action.endpoint.protocol == Protocol.WebSockets || 
                        action.endpoint.grpcMode != gRPCMode.Unary){
                        this.connectionTable[data.requestId] = null;
                        let request = new RequestData();
                        let epRef = new EndpointRef();
                        epRef.endpoint = action.endpoint;
                        epRef.method = EndpointActionHTTPMethod[action.method] == "Inherit" ? data.header.endpoint.method : HTTPMethod[EndpointActionHTTPMethod[action.method]]
                        request.header = {
                            protocol: action.endpoint.protocol,
                            endpoint: epRef,
                            stream: data.header.stream 
                        };
                        request.data = {};
                        request.origin = targetConnection;
                        request.originID = this.originID;
                        request.requestId = data.requestId;
                        this.outputPort.sendData(request, targetConnection);
                    }
                    else{
                        if(dontSendRequestResponse) continue;
                        let newReqId = UUID();
                        this.connectionTable[newReqId] = data.origin
                        let request = new RequestData();
                        let epRef = new EndpointRef();
                        epRef.endpoint = action.endpoint;
                        epRef.method = EndpointActionHTTPMethod[action.method] == "Inherit" ? data.header.endpoint.method : HTTPMethod[EndpointActionHTTPMethod[action.method]]
                        request.header = {
                            protocol: action.endpoint.protocol,
                            endpoint: epRef,
                            stream: data.header.stream 
                        };
                        request.data = {};
                        request.origin = targetConnection;
                        request.originID = this.originID;
                        request.requestId = newReqId;
                        sendResponse = true;
                        await this.outputPort.sendData(request, targetConnection);
                    }
                }
            }
            if(isFirstStreamRequest){
                this.connectionTable[data.requestId] = data.origin;
            }
            if(targetEndpoint.grpcMode == gRPCMode["Server Streaming"]) {
                if(isFirstStreamRequest){
                    let response = new RequestData();
                    response.header = {
                        protocol: targetEndpoint.protocol,
                        endpoint: data.header.endpoint,
                        stream: data.header.stream
                    };
                    response.data = {};
                    response.origin = data.origin;
                    response.originID = this.originID;
                    response.requestId = UUID();
                    response.responseId = data.requestId;
                    this.serverStream(response, targetEndpoint);
                }
                if(isLastStreamRequest){
                    this.connectionTable[data.requestId] = null;
                }
            }
            if(sendResponse){
                // Send data back
                this.connectionTable[data.requestId] = data.origin;
                let response = new RequestData();
                response.header = {
                    protocol: targetEndpoint.protocol,
                    endpoint: data.header.endpoint,
                    stream: data.header.stream
                };
                response.data = {};
                response.origin = data.origin;
                response.originID = this.originID;
                response.requestId = UUID();
                response.responseId = data.requestId;
                await this.sendData(response);
            }
        }
        
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

    onConnectionRemove(wasOutput: boolean = false){}

    async sendData(response: RequestData) {
        let targetConnection = this.connectionTable[response.responseId]
        if(targetConnection == null){
            return;
        }
        let res = await this.inputPort.sendData(response, targetConnection);
        if(!res && response.header.stream){
            response.header.stream = false;
            response.requestId = response.responseId;
            response.responseId = null;
            let res = this.outputPort.sendData(response,response.origin)
            if(res){
                this.connectionTable[response.responseId] = null;
            }
        }
    }

    async serverStream(data: RequestData, streamingEndpoint: Endpoint){
        await sleep(700);
        if(this.connectionTable[data.responseId] == null ||(
            streamingEndpoint.grpcMode != gRPCMode["Server Streaming"]) ||
            this.getEndpoints().indexOf(streamingEndpoint) == -1 ||
            streamingEndpoint.actions.length == 0) return;

        for(let action of streamingEndpoint.actions){
            // Get connection to given action endpoint
            if(action.endpoint == null || action.endpoint.url == null || action.endpoint.grpcMode != gRPCMode.Unary || action.endpoint.protocol == Protocol.WebSockets){
                continue;
            }
            let targetConnection: Connection;
            let has = false;
            for(let connection of this.outputPort.connections){
                for(let x of connection.getOtherPort(this.outputPort).parent.getAvailableEndpoints()){
                    if(has) break;
                    if(action.endpoint.url===x.url &&  arrayEquals(x.supportedMethods,action.endpoint.supportedMethods)){
                        has = true;
                        targetConnection = connection;
                    } 
                }      
                if(has) break;
            }
            if(targetConnection == null) continue;

            let newReqId = UUID();
            this.connectionTable[newReqId] = data.origin
            let request = new RequestData();
            let epRef = new EndpointRef();
            epRef.endpoint = action.endpoint;
            epRef.method = EndpointActionHTTPMethod[action.method] == "Inherit" ? data.header.endpoint.method : HTTPMethod[EndpointActionHTTPMethod[action.method]]
            request.header = {
                protocol: action.endpoint.protocol,
                endpoint: epRef,
            };
            request.data = {};
            request.origin = targetConnection;
            request.originID = this.originID;
            request.requestId = newReqId;
            await this.outputPort.sendData(request, targetConnection);
        }

        await this.sendData(data);
        await this.serverStream(data, streamingEndpoint);
    }

    connectTo(operator: IDataOperator, connectingWithOutput:boolean, connectingToOutput:boolean) : Connection{
        if(connectingWithOutput){
            return this.outputPort.connectTo(operator.getPort(connectingToOutput));
        }
        return this.inputPort.connectTo(operator.getPort(connectingToOutput));
    }

    getPort(outputPort:boolean=false) : Port {
        if(outputPort){
            return this.outputPort;
        }
        return this.inputPort;
    }

    getAvailableEndpoints(): Endpoint[]
    {
        return this.getEndpoints();
    }

    getEndpoints() : Endpoint[]{
        return this.options.restEndpoints
            .concat(this.options.rpcEndpoints)
            .concat(this.options.grpcEndpoints)
            .concat(this.options.graphqlEndpoints)
            .concat(this.options.websocketsEndpoints);
    }

    destroy(){
        this.inputPort.removeConnections();
        this.outputPort.removeConnections();
    }


}

export class APIGatewayOptions extends EndpointOptions{
    restEndpoints: Endpoint[] = [];
    rpcEndpoints: Endpoint[] = [];
    graphqlEndpoints: Endpoint[] = [];
    grpcEndpoints: Endpoint[] = [];
    websocketsEndpoints: Endpoint[] = [];
    type: APIType = APIType.REST
}