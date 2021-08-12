import { Connection } from "./Connection";
import { EndpointRef } from "./Endpoint";
import { Protocol } from "./enums/Protocol";

export class RequestData{
    header: RequestDataHeader;
    origin: Connection;
    originID: string;
    requestId: string;
    responseId: string;
    sendResponse: boolean = true;
}

export class RequestDataHeader {
    endpoint: EndpointRef;
    protocol: Protocol;
    stream: boolean;

    constructor(endpointRef: EndpointRef, protocol: Protocol, stream = false) {
        this.endpoint = endpointRef;
        this.protocol = protocol;
        this.stream = stream;
    }
}