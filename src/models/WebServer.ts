import { IDataOperator } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData, RequestDataHeader } from "./RequestData";
import { Port } from "./Port";
import { UUID } from "src/shared/ExtensionMethods";
import { Protocol } from "./enums/Protocol";
import { Endpoint } from "./Endpoint";
import { HTTPMethod } from "./enums/HTTPMethod";
import { HTTPStatus } from "./enums/HTTPStatus";
import { EndpointOperator, EndpointOptions } from "./EdpointOperator";

export class WebServer extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    options: WebServerOptions;
    connectionTable: { [id:string]: Connection } = {};
    originID: string;

    constructor() {
        super();
        this.inputPort = new Port(this,false,true);      
        this.options = new WebServerOptions();  
        this.options.title = "Web Server";
        this.originID = UUID();
        
        this.options.endpoints = [
            new Endpoint("/",[HTTPMethod.GET])    
        ]
    }

    async receiveData(data: RequestData) {
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

        this.connectionTable[data.requestId] = data.origin;
        this.fireReceiveData(data);

        let response = new RequestData();
        response.header = new RequestDataHeader(data.header.endpoint, Protocol.HTTP);
        response.origin = data.origin;
        response.originID = this.originID;
        response.requestId = UUID();
        response.responseId = data.requestId;
        await this.sendData(response);
    }

    onConnectionUpdate(wasOutput: boolean = false){}

    async sendData(response: RequestData) {
        let targetConnection = this.connectionTable[response.responseId]
        if(targetConnection == null)
            throw new Error("Target connection can not be null");
        this.connectionTable[response.responseId] = null; // reset request id
        await this.inputPort.sendData(response, targetConnection);
    }

    getAvailableEndpoints(): Endpoint[]{
        return this.options.endpoints;
    }

    destroy(){
        this.inputPort.removeConnections();
    }
}

export class WebServerOptions extends EndpointOptions{
}