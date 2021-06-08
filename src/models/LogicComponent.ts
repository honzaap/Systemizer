import { IDataOperator, ReceiveDataEvent, ShowStatusCodeEvent } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { Port } from "./Port";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";

export class LogicComponent {

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
            if(outputPort != null) 
                return !port.isOutput;
        }
        else{
            let inputPort = this["inputPort"];
            if(inputPort != null)
                return port.isOutput;
        }
        return false;
    }

    getPort(outputPort: boolean = false): Port{
        if(outputPort)
            return this["outputPort"];
        return this["inputPort"];
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
}