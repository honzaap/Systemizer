import { RequestData } from "./RequestData";
import { Port } from "./Port";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";

interface SendDataEvent {}

export class Connection{
    port1: Port;
    port2: Port;

    constructor(port1: Port, port2: Port) {
        this.port1 = port1;
        this.port2 = port2;
    }

    getOtherPort(port: Port): Port{
        return port === this.port1 ? this.port2 : this.port1;
    }

    /**
     * sendData: sends data to connection
     */
    public async sendData(data: RequestData, origin: Port) {
        if(origin === this.port1){
            this.fireSendData(origin);
            await this.port2.receiveData(data);
        }
        else if(origin === this.port2){
            this.fireSendData(origin);
            await this.port1.receiveData(data);
        }
        else
            throw new Error("Invalid origin in Connection.sendData");
    }

    destroy(){
        this.port1.removeConnection(this,true);
    }

    
    private sendDataDispatcher = new EventDispatcher<SendDataEvent>();
    public onSendData(handler: Handler<SendDataEvent>) {
        this.sendDataDispatcher.register(handler);
    }
    private fireSendData(event: SendDataEvent) { 
        this.sendDataDispatcher.fire(event);
    }
}