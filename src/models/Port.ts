import { IDataOperator } from "src/interfaces/IDataOperator";
import { sleep } from "src/shared/ExtensionMethods";
import { Connection } from "./Connection";
import { RequestData } from "./RequestData";
import { EventDispatcher, Handler } from "./Shared/EventDispatcher";

interface RemoveConnectionEvent { }

export class Port{
    connections: Connection[] = [];
    parent: IDataOperator;
    isOutput:boolean;
    hasMultipleConnections:boolean;

    /**
     * 
     * @param parent: parent of port
     */
    constructor(parent: IDataOperator, isOutput: boolean = false, hasMultipleConnections: boolean = false) {
        this.parent = parent;
        this.isOutput = isOutput;
        this.hasMultipleConnections = hasMultipleConnections;
    }

    /**
     * sendData: sends data to connection property
     */
    public async sendData(data: RequestData, target: Connection = null) {
        if(this.connections.length == 0) 
            return false;
        if(this.hasMultipleConnections){
            if(target == null)
                await this.connections[0].sendData(data, this);
            else{
                let idx = this.connections.indexOf(target);
                if(idx == -1) 
                    return false;
                await this.connections[idx].sendData(data, this);
            }
        }
        else{
            if(this.connections.length > 0)
                await this.connections[0].sendData(data, this);
        }
        return true;
    }

    /**
     * receiveData: sends data received from connection to parent property
     */
    public async receiveData(data: RequestData, delay: number = 180) {
        await sleep(delay);
        await this.parent.receiveData(data,this.isOutput);
    }

    /**
     * connectTo: connects this port to given port via Connection class
     */
    public connectTo(port: Port) : Connection {
        if(!this.isConnectedTo(port)){
            if(this.hasMultipleConnections){
                let connection = new Connection(this, port);
                this.connections.push(connection);
                port.connectWith(connection);
                this.parent.onConnectionUpdate(this.isOutput);
                return connection;
            }
            else{
                let connection = new Connection(this, port);
                this.removeConnections(false);
                this.connections  = [connection];
                port.connectWith(connection); 
                this.parent.onConnectionUpdate(this.isOutput);
                return connection;
            }
        }
        return null;
    }

    /**
     * connectWith: connects this port to given connection
     */
    public connectWith(connection: Connection) {
        if(this.hasMultipleConnections){
            this.connections.push(connection);
        }
        else{
            this.removeConnections(false);
            this.connections = [connection];
        }
        this.parent.onConnectionUpdate(this.isOutput);
    }

    public removeConnection(connection: Connection, removeFromOther:boolean = false, triggerOnRemove:boolean = true){
        let connectionIndex = 0;
        let hasConnection = false;
        for(let connected of this.connections){
            if(connection === connected){
                hasConnection=true;
                break;
            }
            connectionIndex++;
        }
        if(hasConnection){
            this.fireRemoveConnection(this.connections[connectionIndex]);
            if(removeFromOther)this.connections[connectionIndex].getOtherPort(this).removeConnection(this.connections[connectionIndex]);
            this.connections.splice(connectionIndex,1);
        }
        if(triggerOnRemove)
            this.parent.onConnectionUpdate(this.isOutput);
    }

    public removeConnections(triggerOnRemove = true){
        let removed = this.connections.length > 0;
        while(this.connections.length > 0){
            this.removeConnection(this.connections[0], true, false);
        }
        if(triggerOnRemove && removed)
            this.parent.onConnectionUpdate(this.isOutput);
    }

    /**
     * isConnectedTo: returns true if connected to given port via Connection
     */
    public isConnectedTo(port: Port) : boolean {
        for(let connecion of this.connections){
            if(connecion.getOtherPort(this) === port) 
                return true;
        }
        return false;
    }

    private removeConnectionDispatcher = new EventDispatcher<RemoveConnectionEvent>();
    public onRemoveConnection(handler: Handler<RemoveConnectionEvent>) {
        this.removeConnectionDispatcher.register(handler);
    }
    private fireRemoveConnection(event: RemoveConnectionEvent) { 
        this.removeConnectionDispatcher.fire(event);
    }
}