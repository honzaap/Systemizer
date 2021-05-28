import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Options } from "./Options";
import { Port } from "./Port";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";
import { UUID } from "src/shared/ExtensionMethods";
import { Protocol } from "./enums/Protocol";
import { Endpoint } from "./Endpoint";
import { HTTPMethod } from "./enums/HTTPMethod";
import { HTTPStatus } from "./enums/HTTPStatus";
import { EndpointOperator, EndpointOptions } from "./EdpointOperator";

interface ReceiveDataEvent { }

export class WebServer extends EndpointOperator implements IDataOperator{

    port: Port;
    options: WebServerOptions;
    connectionTable: {[id:string]:Connection} = {};
    originID: string;

    constructor() {
        super();
        this.port = new Port(this,false,true);      
        this.options = new WebServerOptions();  
        this.options.title = "Web Server";
        this.originID = UUID();
        
        this.options.endpoints = [
            new Endpoint("/",[HTTPMethod.GET])    
        ]
    }

    async receiveData(request: RequestData) {

         // Checking for 404 and 405
         let was = false;
         let notAllowed = false;
         let targetEndpoint: Endpoint;
         for(let endpoint of this.options.endpoints){
             if(endpoint.url === request.header.endpoint.endpoint.url){
                 was = true;
                 if(endpoint.supportedMethods.indexOf(request.header.endpoint.method) == -1){
                     notAllowed = true;
                 }
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

        this.connectionTable[request.requestId] = request.origin;

        this.fireReceiveData(request);

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
        await this.port.sendData(response, targetConnection);
    }

    connectTo(operator: IDataOperator, connectingWithOutput:boolean, connectingToOutput:boolean) : Connection{
        return this.port.connectTo(operator.getPort(connectingToOutput));
    }

    getPort(outputPort:boolean=false) : Port {
        return this.port;
    }

    getAvailableEndpoints(): Endpoint[]
    {
        return this.options.endpoints;
    }

    destroy(){
        this.port.removeConnections();
    }
}

export class WebServerOptions extends EndpointOptions{

}