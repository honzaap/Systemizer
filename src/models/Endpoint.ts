import { gRPCMode } from "./enums/gRPCMode";
import { EndpointActionHTTPMethod, HTTPMethod } from "./enums/HTTPMethod";
import { Protocol } from "./enums/Protocol";

export class Endpoint{
    url: string;
    supportedMethods: HTTPMethod[] = [];
    protocol: Protocol = Protocol.HTTP;
    actions: EndpointAction[] = [];
    grpcMode: gRPCMode = gRPCMode.Unary

    constructor(url: string, supportedMethods: HTTPMethod[] = []) {
        this.url = url;
        this.supportedMethods = supportedMethods;
    }
}

export class EndpointRef {
    endpoint: Endpoint;
    method: HTTPMethod;
    topic: string;
}

export class EndpointAction {
    endpoint: Endpoint;
    method: EndpointActionHTTPMethod;
}

export class DatabaseEndpoint extends Endpoint{
    constructor(url: string){
        super(url, [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.DELETE]);
        this.actions = null;
        this.grpcMode = gRPCMode.Unary;
        this.protocol = Protocol.Database
    }
}

export class MQEndpoint extends Endpoint{
    constructor(url = "Message Queue"){
        super(url, [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.PATCH, HTTPMethod.DELETE])
    }
}