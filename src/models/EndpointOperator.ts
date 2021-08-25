import { sleep, UUID } from "src/shared/ExtensionMethods";
import { Endpoint } from "./Endpoint";
import { HTTPStatus } from "./enums/HTTPStatus";
import { LogicComponent } from "./LogicComponent";
import { Options } from "./Options";
import { Port } from "./Port";
import { RequestData, RequestDataHeader } from "./RequestData";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";

export class SimulationState{
    responseTime: number = 0;
    maximumFlow: number = 0;
    incomingFlow: number = 0;
    rawIncomingFlow: number = 0;
    rating: number = 100;
    flowRatio: number = 0;
}

export class EndpointOperator extends LogicComponent{
    constructor() {
        super();
    }

    outputPort: Port;
    inputPort: Port;
    options: EndpointOptions;
    requestCount: number = 0;
    simulationState: SimulationState = new SimulationState();
    isFlowSimulationOn: boolean;

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
    async throttleThroughput(timeoutLimit: number = -1): Promise<boolean>{
        if(!this.isFlowSimulationOn)
            return true;
        // Simulate throughput (start sending data to actions every X seconds)
        let sleepTime = this.calculateThroughputThrottleTime();
        if(timeoutLimit > 0 && sleepTime > timeoutLimit){
            this.inputPort.fireDropRequest({});
            return false;
        }

        await sleep(sleepTime);
        return true;
    }

    private calculateThroughputThrottleTime(){
        let sleepTime = 0;
        if(this.options.performance < 4){
            if(this.options.performance === 1)
                sleepTime = this.requestCount * (250 * (this.requestCount - 1));
            else
                sleepTime = this.requestCount * (550 * (this.requestCount + 1)) / Math.pow(this.options.performance, 2);
        }
        else{
            sleepTime = (this.requestCount * Math.max(Math.log10(this.requestCount),1) * 10000) / Math.pow(this.options.performance, 3);
        }
        this.simulationState.responseTime = Math.max(Math.round(sleepTime / 50) * 50, 50);;
        return sleepTime;
    }

    /**
     * Increments currently processing requests
     */
    protected requestReceived(){
        this.requestCount++;
        if(this.isFlowSimulationOn){
            let pre = this.simulationState.rawIncomingFlow;
            // Incoming flow will be easier to increment at smaller flow
            let increment = 1+1/Math.max(this.simulationState.incomingFlow, 1); 
            this.simulationState.rawIncomingFlow+= increment;
            this.calculateSimulationState(pre);
            setTimeout(() => {
                let pre = this.simulationState.rawIncomingFlow;
                this.simulationState.rawIncomingFlow-= increment;
                this.calculateSimulationState(pre);
            }, 5000);
        }
    }

    /**
     * Updates simulation state and fires event for change detection
     */
    private calculateSimulationState(previousRawIncomingFlow: number){
        this.simulationState.incomingFlow = Math.ceil((previousRawIncomingFlow + this.simulationState.rawIncomingFlow) / 2 / 5);
        this.simulationState.flowRatio = (this.simulationState.incomingFlow / this.options.performance);
        let oldRating = this.simulationState.rating;
        setTimeout(() => { // Prevent some cases of switching in and out infinitely due to rating
            if(this.simulationState.rating === oldRating){
                this.simulationState.rating = Math.max(Math.min(100 - 100 * (this.simulationState.responseTime / 550) + 100, 100), 0);
            }
        }, 500);
        
        this.fireSimulationStateUpdated(this.simulationState);
    }

    /**
     * Decrements currently processing requests
     */
    protected requestProcessed(){
        setTimeout(() => {
            this.requestCount--;
            this.calculateThroughputThrottleTime();
        }, 350);
    }

    protected simulationStateUpdatedDispatcher = new EventDispatcher<SimulationState>();
    public onSimulationStateUpdated(handler: Handler<SimulationState>) {
        this.simulationStateUpdatedDispatcher.register(handler);
    }
    protected fireSimulationStateUpdated(event: SimulationState) { 
        this.simulationStateUpdatedDispatcher.fire(event);
    }
}

export class EndpointOptions extends Options{
    endpoints: Endpoint[] = [];
    performance: number = 10;
}