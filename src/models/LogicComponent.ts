import { IDataOperator, ReceiveDataEvent, ShowStatusCodeEvent, FailedConnectEvent } from "src/interfaces/IDataOperator";
import { UUID } from "src/shared/ExtensionMethods";
import { Connection } from "./Connection";
import { Port } from "./Port";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";

export class LogicComponent {

    originID: string = UUID();

    connectTo(operator: IDataOperator, connectingWithOutput:boolean, connectingToOutput:boolean) : Connection{
        let otherPort = operator.getPort(connectingToOutput);
        if(!operator.canConnectTo(this.getPort(connectingWithOutput), connectingToOutput) || !this.canConnectTo(otherPort, connectingWithOutput)) 
            return null;
        return this.getPort(connectingWithOutput).connectTo(otherPort);
    }

    canConnectTo(port: Port, connectingWithOutput: boolean){
        // Any component must connect with either IN to OUT or OUT to IN
        if(connectingWithOutput){
            let outputPort = this["outputPort"];
            if(outputPort != null) {
                if(!port.isOutput)
                    return true;
            }
        }
        else{
            let inputPort = this["inputPort"];
            if(inputPort != null) {
                if(port.isOutput)
                    return true;
            }
        }
        this.fireFailedConnect({message: "You can only connect input to output."});
        return false;
    }

    getPort(outputPort: boolean = false): Port{
        if(outputPort)
            return this["outputPort"];
        return this["inputPort"];
    }

    destroy(){
        if(this["outputPort"])
            this["outputPort"].removeConnections();
        if(this["inputPort"])
            this["inputPort"].removeConnections();
    }

    protected receiveDataDispatcher = new EventDispatcher<ReceiveDataEvent>();
    public onReceiveData(handler: Handler<ReceiveDataEvent>) {
        this.receiveDataDispatcher.register(handler);
    }
    protected fireReceiveData(event: ReceiveDataEvent) { 
        this.receiveDataDispatcher.fire(event);
    }

    protected showStatusCodeDispatcher = new EventDispatcher<ShowStatusCodeEvent>();
    public onShowStatusCode(handler: Handler<ShowStatusCodeEvent>) {
        this.showStatusCodeDispatcher.register(handler);
    }
    protected fireShowStatusCode(event: ShowStatusCodeEvent) { 
        this.showStatusCodeDispatcher.fire(event);
    }

    protected failedConnectDispatcher = new EventDispatcher<FailedConnectEvent>();
    public onFailedConnect(handler: Handler<FailedConnectEvent>) {
        this.failedConnectDispatcher.register(handler);
    }
    protected fireFailedConnect(event: FailedConnectEvent) { 
        this.failedConnectDispatcher.fire(event);
    }
}