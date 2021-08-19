import { getRateFromPerformance, sleep, UUID } from "src/shared/ExtensionMethods";
import { Endpoint } from "./Endpoint";
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
    inputPort: Port;
    options: EndpointOptions;
    private lastTimeActionSent: number = 0;
    requestCount: number = 0;

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

    getAvailableEndpoints(): Endpoint[]{
        return this.getEndpoints();
    }

    /**
     * waits until next request can be processed (determined by performance).
     * If a timeoutLimit is specified, false will be returned after that time of waiting (if it exceedes the actual wait time). 
    */
    async throttleThroughput(waitForActions: boolean = true, timeoutLimit: number = -1): Promise<boolean>{
        if(!this.isFlowSimulationOn)
            return true;
        // Simulate throughput (start sending data to actions every X seconds)
        let rate = 1 / getRateFromPerformance(this.options.performance);
        if(!waitForActions)
            rate /= 2;
        let sleepTime = Math.max((this.lastTimeActionSent + rate * 1000) - performance.now(), 0);
        if(timeoutLimit > 0 && sleepTime > timeoutLimit){
            //this.lastTimeActionSent = performance.now() + timeoutLimit;
            //await sleep(timeoutLimit);
            this.inputPort.fireDropRequest({});
            return false;
        }
        this.lastTimeActionSent = performance.now() + sleepTime;
        await sleep(sleepTime);
        return true;
    }

    /**
     * Increments currently processing requests
     */
    protected requestReceived(){
        this.requestCount++;
    }

    /**
     * Decrements currently processing requests
     */
    protected requestProcessed(){
        this.requestCount--;
    }
}

export class EndpointOptions extends Options{
    endpoints: Endpoint[] = [];
    performance: number = 10;
}