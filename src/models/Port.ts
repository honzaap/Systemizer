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
        if(this.connections.length == 0) return false;
        if(this.hasMultipleConnections){
            if(target == null){
                await this.connections[0].sendData(data, this);
            }
            else{
                let idx = this.connections.indexOf(target);
                if(idx == -1) return false;
                await this.connections[idx].sendData(data, this);
            }
        }
        else{
            if(this.connections.length > 0){
                await this.connections[0].sendData(data, this);
            }
        }
        return true;
    }

    /**
     * receiveData: sends data received from connection to parent property
     */
    public async receiveData(data: RequestData) {
        await sleep(180);
        await this.parent.receiveData(data,this.isOutput);
        //setTimeout(()=>{this.parent.receiveData(data,this.isOutput);},180);
    }

    /**
     * connectTo: connects this port to given port via Connection class
     */
    public connectTo(port: Port) : Connection {
        console.log(`${this.parent.options.title} has multiple: ${this.hasMultipleConnections}`);
        if(this.hasMultipleConnections){
            if(!this.isConnectedTo(port)){
                let connection = new Connection(this, port);
                this.connections.push(connection);
                port.connectWith(connection);
                this.parent.onConnectionRemove(this.isOutput);
                return connection;
            }
        }
        else{
            if(!this.isConnectedTo(port)){
                let connection = new Connection(this, port);
                this.removeConnections(false);
                this.connections  = [connection];
                port.connectWith(connection); 
                this.parent.onConnectionRemove(this.isOutput);
                return connection;
            }
        }
        return null;
    }

    /**
     * connectWith: connects this port to given connection
     */
    public connectWith(connection: Connection) {
        console.log(`${this.parent.options.title} has multiple: ${this.hasMultipleConnections}`);
        if(this.hasMultipleConnections){
            this.connections.push(connection);
            this.parent.onConnectionRemove(this.isOutput);
        }
        else{
            this.removeConnections(false);
            this.connections = [connection];
            this.parent.onConnectionRemove(this.isOutput);
        }
    }

    public removeConnection(connection: Connection, removeFromOther:boolean = false, triggerOnRemove:boolean = true){
        let idx = 0;
        let was = false;
        for(let connected of this.connections){
            if(connection === connected){
                was=true;
                break;
            }
            idx++;
        }
        if(was){
            this.fireRemoveConnection(this.connections[idx]);
            if(removeFromOther)this.connections[idx].getOtherPort(this).removeConnection(this.connections[idx]);
            this.connections.splice(idx,1);
        }
        if(triggerOnRemove){
            this.parent.onConnectionRemove(this.isOutput);
        }
    }

    public removeConnections(triggerOnRemove = true){
        let removed = this.connections.length > 0;
        while(this.connections.length > 0){
            this.removeConnection(this.connections[0], true, false);
        }
        if(triggerOnRemove && removed){
            this.parent.onConnectionRemove(this.isOutput);
        }
    }

    /**
     * isConnectedTo: returns true if connected to given port via Connection
     */
    public isConnectedTo(port: Port) : boolean {
        for(let connecion of this.connections){
            if(connecion.getOtherPort(this) === port) return true;
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