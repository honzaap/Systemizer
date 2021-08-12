import { IDataOperator, ReceiveDataEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Port } from "./Port";
import { Endpoint, EndpointRef, MQEndpoint } from "./Endpoint";
import { sleep, UUID } from "src/shared/ExtensionMethods";
import { API } from "./API";
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
    isConsumable: boolean = true;

    constructor() {
        super();
        this.inputPort = new Port(this, false, true);        
        this.outputPort = new Port(this, true, true);        
        this.options = new MessageQueueOptions();
        this.options.title = "Message Queue";

        this.options.endpoints = [
            new MQEndpoint()
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

        // Return response to publisher
        let response = new RequestData();
        response.responseId = data.requestId;
        response.requestId = UUID();
        response.header = data.header;
        response.origin = data.origin;
        response.originID = this.originID;
        await this.inputPort.sendData(response, data.origin);
    }

    async sendToConsumer(){
        if(this.messages.length == 0 || this.outputPort.connections.length == 0)
            return;
        this.isSendingData = true;
        await sleep(400);

        let message = this.messages.pop();
        let epRef = new EndpointRef();
        epRef.endpoint = new Endpoint(this.options.endpoints[0].url, [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.PATCH, HTTPMethod.DELETE]);
        epRef.method = HTTPMethod.POST;
        message.header.endpoint = epRef;

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
        let nodesLength = this.outputPort.connections.length;
        this.roundRobinIndex++;
        if(this.roundRobinIndex >= nodesLength)
            this.roundRobinIndex = 0;

        data.origin = this.outputPort.connections[this.roundRobinIndex];
        await this.outputPort.sendData(data,data.origin);
    }

    onConnectionUpdate(wasOutput: boolean = false){
        this.sendToConsumer();
    }

    connectTo(operator: IDataOperator, connectingWithOutput: boolean, connectingToOutput: boolean) : Connection{
        let otherPort = operator.getPort(connectingToOutput);
        if(!this.canConnectTo(otherPort, connectingWithOutput)) 
            return null;
        if(!operator.canConnectTo(this.getPort(connectingWithOutput), connectingToOutput)) 
            return null; 
        if(connectingWithOutput){
            let conn = this.outputPort.connectTo(otherPort);
            if(conn != null && operator instanceof API)
                (operator as API).initiateConsumer(conn);
            return conn;
        }
        return this.inputPort.connectTo(otherPort);
    }

    canConnectTo(port: Port, connectingWithOutput: boolean){
        if(!super.canConnectTo(port, connectingWithOutput))
            return false;
        // Output of MQ can connect only to API  
        if(!connectingWithOutput)
            return true;
        if(port.parent instanceof API)
            return true;
        this.fireFailedConnect({message: "Output of a Message Queue can only be conencted to an API"});
        return false;
    }

    getAvailableEndpoints(): Endpoint[]{
        return this.options.endpoints;
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

