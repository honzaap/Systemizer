import { UUID } from "src/shared/ExtensionMethods";
import { Endpoint } from "./Endpoint"
import { HTTPStatus } from "./enums/HTTPStatus";
import { LogicComponent } from "./LogicComponent";
import { Options } from "./Options";
import { Port } from "./Port";
import { RequestData, RequestDataHeader } from "./RequestData";

export class EndpointOperator extends LogicComponent{
    constructor() {
        super();
    }

    outputPort: Port;
    options: EndpointOptions;

    getConnectableEndpoints() : Endpoint[]{
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

    getTargetEndpoint(data: RequestData): Endpoint{
        // Checking for 404 and 405
        let hasEndpoint = false;
        let notAllowed = false;
        let targetEndpoint: Endpoint;
        let targetUrl = data.header.endpoint.endpoint.url;

        this.getEndpoints().filter(endpoint => 
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
            return null;
        }
        if(notAllowed){
            this.fireShowStatusCode(HTTPStatus["Method Not Allowed"]);
            return null;
        }
        return targetEndpoint;
    }

    /**
     * Gets response to given request
     * @param request request the response belongs to
     */
    getResponse(request: RequestData){
        let response = new RequestData();
        response.header = new RequestDataHeader(request.header.endpoint, request.header.protocol, request.header.stream);
        response.origin = request.origin;
        response.originID = this.originID;
        response.requestId = UUID();
        response.responseId = request.requestId;
        return response;
    }

    getEndpoints(){
        return this.options.endpoints;
    }
}

export class EndpointOptions extends Options{
    endpoints: Endpoint[] = [];
    //performance: number = 5; Will be used for simulation in the future
}