import { IDataOperator, ReceiveDataEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Port } from "./Port";
import { Endpoint, EndpointRef } from "./Endpoint";
import { sleep, UUID } from "src/shared/ExtensionMethods";
import { EndpointOperator, EndpointOptions } from "./EndpointOperator";
import { HTTPMethod } from "./enums/HTTPMethod";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";

export class MessageQueue extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    outputPort: Port;
    connectionTable: {[id:string]:Connection} = {};
    options: MessageQueueOptions;
    roundRobinIndex = 0;
    isSendingData = false;
    fillColor = false;
    color = "#F2994A";

    messages: RequestData[] = []

    constructor() {
        super();
        this.inputPort = new Port(this, false, true);        
        this.outputPort = new Port(this, true, true);        
        this.options = new MessageQueueOptions();
        this.options.title = "Message Queue";

        this.options.endpoints = [
            new Endpoint("MessageQueue", [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.DELETE, HTTPMethod.PATCH])
        ];
    }

    async receiveData(data: RequestData) {
        if(data.requestId == "" || data.requestId == null )
            throw new Error("requestId can not be null. Please specify property requestId of RequestData");


        // Put data to queue 
        data.header.stream = false;
        this.messages.push(data);
        if(!this.isSendingData)
            this.sendToConsumer();

        this.fireReceiveData(data);
        this.requestReceived();

        

        // Return response to publisher
        let response = new RequestData();
        response.responseId = data.requestId;
        response.requestId = UUID();
        response.header = data.header;
        response.origin = data.origin;
        response.originID = this.originID;
        // Send response back
        this.requestProcessed();
        if(data.sendResponse)
            await this.inputPort.sendData(response, data.origin);
    }

    async sendToConsumer(){
        if(this.messages.length == 0 || this.outputPort.connections.length == 0)
            return;
        this.isSendingData = true;
        if(!await this.throttleThroughput(5000)){
            this.requestProcessed();
            return;
        }
        //await sleep(400);
        
        let message = this.messages.pop();
        let epRef = new EndpointRef();
        epRef.endpoint = new Endpoint(this.options.endpoints[0].url, [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.PATCH, HTTPMethod.DELETE]);
        epRef.method = HTTPMethod.POST;
        message.header.endpoint = epRef;
        message.sendResponse = false;

        this.sendData(message);
        this.fireSendData({});
    
        if(this.messages.length == 0)
            this.isSendingData = false;
        else 
            this.sendToConsumer();
    }

    async sendData(data: RequestData){
        data.originID = this.originID;
        await this.roundRobin(data);
    }

    async roundRobin(data: RequestData){
        let connections = this.outputPort.connections
        .filter(conn => conn.getOtherPort(this.outputPort).parent.getAvailableEndpoints()
        .find(ep => ep.url === this.options.endpoints[0].url) != null);
        let nodesLength = connections.length;
        if(nodesLength === 0){
            this.messages.push(data);
            return;
        }
        this.fireSendData({});
        this.roundRobinIndex++;
        if(this.roundRobinIndex >= nodesLength)
            this.roundRobinIndex = 0;
        data.origin = this.outputPort.connections[this.roundRobinIndex];
        await this.outputPort.sendData(data,data.origin);
    }

    onConnectionUpdate(wasOutput: boolean = false){
        this.sendToConsumer();
    }

    private sendDataDispatcher = new EventDispatcher<ReceiveDataEvent>();
    public onSendData(handler: Handler<ReceiveDataEvent>) {
        this.sendDataDispatcher.register(handler);
    }
    private fireSendData(event: ReceiveDataEvent) { 
        this.sendDataDispatcher.fire(event);
    }
}

export class MessageQueueOptions extends EndpointOptions{
}

