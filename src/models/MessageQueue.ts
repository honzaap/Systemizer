import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Options } from "./Options";
import { Port } from "./Port";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";
import { Endpoint, EndpointRef, MQEndpoint } from "./Endpoint";
import { arrayEquals, sleep, UUID } from "src/shared/ExtensionMethods";
import { API } from "./API";
import { EndpointOperator, EndpointOptions } from "./EdpointOperator";
import { HTTPMethod } from "./enums/HTTPMethod";

interface ReceiveDataEvent { }

export class MessageQueue extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    outputPort: Port;
    connectionTable: {[id:string]:Connection} = {};
    options: MessageQueueOptions;
    originID: string;
    roundRobinIndex = 0;
    isSendingData = false;

    messages: RequestData[] = []

    constructor() {
        super();
        this.inputPort = new Port(this, false, true);        
        this.outputPort = new Port(this, true, true);        
        this.options = new MessageQueueOptions();
        this.options.title = "Message Queue";
        this.originID = UUID();

        this.options.endpoints = [
            new MQEndpoint()
        ];
    }

    async receiveData(data: RequestData) {
        //console.log("Message Queue got data: ",data);
        if(data.requestId == "" || data.requestId == null )
        {
            throw new Error("requestId can not be null. Please specify property requestId of RequestData")
        }

        this.fireReceiveData(data);

        // Put data to queue 
        data.header.stream = false;
        this.messages.push(data);
        if(!this.isSendingData){
            this.sendToConsumer();
        }

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
        if(this.messages.length == 0 || this.outputPort.connections.length == 0){
            return;
        }
        this.isSendingData = true;
        await sleep(400);

        let message = this.messages.pop();
        let epRef = new EndpointRef();
        epRef.endpoint = new Endpoint(this.options.title, [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.PATCH, HTTPMethod.DELETE]);
        epRef.method = HTTPMethod.POST;
        message.header.endpoint = epRef;

        this.sendData(message);
    
        if(this.messages.length == 0){
            this.isSendingData = false;
        }
        else {
            this.sendToConsumer();
        }
    }

    async sendData(data: RequestData){
        data.originID = this.originID;
        await this.roundRobin(data);
    }

    async roundRobin(data: RequestData){
        let nodesLength = this.outputPort.connections.length;
        this.roundRobinIndex++;
        if(this.roundRobinIndex >= nodesLength){
            this.roundRobinIndex = 0;
        }
        data.origin = this.outputPort.connections[this.roundRobinIndex];
        await this.outputPort.sendData(data,data.origin);
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

    onConnectionRemove(wasOutput: boolean = false){
        this.sendToConsumer();
    }

    connectTo(operator: IDataOperator, connectingWithOutput:boolean, connectingToOutput:boolean) : Connection{
        if(connectingWithOutput){
            let conn = this.outputPort.connectTo(operator.getPort(connectingToOutput));
            if(conn != null && operator instanceof API){
                (operator as API).initiateConsumer(conn);
            }
            return conn;
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
        return this.options.endpoints;
    }

    destroy(){
        this.inputPort.removeConnections();
        this.outputPort.removeConnections();
    }
}

export class MessageQueueOptions extends EndpointOptions{
}

