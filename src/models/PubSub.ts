import { IDataOperator, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { Port } from "./Port";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";
import { Endpoint, EndpointRef, MQEndpoint } from "./Endpoint";
import { sleep, UUID } from "src/shared/ExtensionMethods";
import { API } from "./API";
import { EndpointOperator, EndpointOptions } from "./EdpointOperator";
import { HTTPMethod } from "./enums/HTTPMethod";

interface ReceiveDataEvent { }

export class PubSub extends EndpointOperator implements IDataOperator{

    inputPort: Port;
    outputPort: Port;
    connectionTable: {[id:string]:Connection} = {};
    options: PubSubOptions;
    originID: string;

    constructor() {
        super();
        this.inputPort = new Port(this, false, true);        
        this.outputPort = new Port(this, true, true);        
        this.options = new PubSubOptions();
        this.options.title = "Pub/Sub Model";
        this.originID = UUID();

        this.options.endpoints = [
            new MQEndpoint("post.postCreated")
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
        this.sendToConsumers(data);

        // Return response to publisher
        let response = new RequestData();
        response.responseId = data.requestId;
        response.requestId = UUID();
        response.header = data.header;
        response.origin = data.origin;
        response.originID = this.originID;
        await this.inputPort.sendData(response, data.origin);
    }

    async sendToConsumers(message: RequestData){
        await sleep(200);

        message.header.endpoint.method = HTTPMethod.POST;
        
        this.sendData(message);
    }

    async sendData(data: RequestData){
        data.originID = this.originID;
        let targetEndpoint = data.header.endpoint.endpoint.url;
        console.log("target: ", targetEndpoint);
        let connections = this.outputPort.connections.filter(connection => {
            return (connection.getOtherPort(this.outputPort).parent.options as EndpointOptions).endpoints
                .find(ep => ep.url == targetEndpoint) != null
        });
        console.log("conns: ", connections.length)
        for(let connection of connections){

            data.origin = connection;
            this.outputPort.sendData(data,data.origin);
        }
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
    }

    connectTo(operator: IDataOperator, connectingWithOutput:boolean, connectingToOutput:boolean) : Connection{
        if(connectingWithOutput){
            let conn = this.outputPort.connectTo(operator.getPort(connectingToOutput));
            if(conn != null && operator instanceof API){
                (operator as API).initiateConsumer(conn, true);
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

export class PubSubOptions extends EndpointOptions{
}

