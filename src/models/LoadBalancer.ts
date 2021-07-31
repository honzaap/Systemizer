import * as objectHash from 'object-hash';
import { IDataOperator } from "src/interfaces/IDataOperator";
import { Connection } from "./Connection";
import { Endpoint } from "./Endpoint";
import { BalancingAlgorithm } from "./enums/BalancingAlgorithm";
import { LoadBalancerType } from "./enums/LoadBalancerType";
import { LogicComponent } from "./LogicComponent";
import { Options } from "./Options";
import { Port } from "./Port";
import { RequestData } from "./RequestData";

export class LoadBalancer extends LogicComponent implements IDataOperator{
    inputPort: Port;
    outputPort: Port;
    connectionTable: {[id:string]:Connection} = {};
    streamConnectionTable: { [id:string]:Connection } = {};
    options: LoadBalancerOptions;
    color = "#021B79";

    roundRobinIndex = -1;

    constructor() {
        super();
        this.inputPort = new Port(this, false, true);        
        this.outputPort = new Port(this, true, true);        
        this.options = new LoadBalancerOptions();
        this.options.title = "Load Balancer";
    }

    async receiveData(data: RequestData, fromOutput:boolean) {
        if(fromOutput){
            let targetConnection = this.connectionTable[data.responseId];
            if(targetConnection == null)
                throw new Error("Connection doesnt exist (response to unknown request)");
            if(data.header.stream != true) {
                this.connectionTable[data.responseId] = null;  // reset request id
                this.streamConnectionTable[data.responseId] = null;
            }
            this.fireReceiveData(data);
            let result = await this.inputPort.sendData(data,targetConnection);
            if(!result && data.header.stream){
                data.header.stream = false;
                data.requestId = data.responseId;
                data.responseId = null;
                let res = this.outputPort.sendData(data,data.origin);
                if(res){
                    this.connectionTable[data.responseId] = null;
                    this.streamConnectionTable[data.responseId] = null;
                }
            }
        }
        else{
            if(data.requestId == null )
                throw new Error("requestId can not be null. Please specify property requestId of RequestData");

            this.fireReceiveData(data);

            if(this.streamConnectionTable[data.requestId] != null){
                data.origin = this.streamConnectionTable[data.requestId];
                data.originID = this.originID;
                await this.outputPort.sendData(data,this.streamConnectionTable[data.requestId]);
                return;
            }

            this.connectionTable[data.requestId] = data.origin;

            switch(this.options.algorithm){
                case BalancingAlgorithm["Round Robin"]:
                    await this.roundRobin(data);
                    break;
                case BalancingAlgorithm["IP Hash"]:
                    await this.ipHash(data);
                    break;
                case BalancingAlgorithm["Least Connections"]:
                    await this.leastConnections(data);
                    break;
                case BalancingAlgorithm["URL Hash"]:
                    await this.urlHash(data);
                    break;   
                default:
                    await this.roundRobin(data);
                    break;            
            }
        }
    }

    async roundRobin(data: RequestData){
        let nodesLength = this.outputPort.connections.length;
        this.roundRobinIndex++;
        if(this.roundRobinIndex >= nodesLength){
            this.roundRobinIndex = 0;
        }
        data.origin = this.outputPort.connections[this.roundRobinIndex];
        data.originID = this.originID;
        this.streamConnectionTable[data.requestId] = data.origin;
        await this.outputPort.sendData(data,data.origin);
    }

    async ipHash(data: RequestData){
        let hash = objectHash({id:data.originID}).substr(0,2);
        let hashInt = parseInt(hash,16);
        let length = this.outputPort.connections.length;
        let connectionIndex = hashInt % length;
        data.origin = this.outputPort.connections[connectionIndex];
        data.originID = this.originID;
        this.streamConnectionTable[data.requestId] = data.origin;
        await this.outputPort.sendData(data, this.outputPort.connections[connectionIndex]);
    }

    async leastConnections(data: RequestData){
        let allConnections: Connection[] = [];
        let keys = Object.keys(this.streamConnectionTable);
        for(let i = keys.length-1; i >= 0; i--){
            let conn = keys[i];
            if(this.streamConnectionTable[conn] == null) 
                break;
            allConnections.push(this.streamConnectionTable[conn]);
        }
        let least = this.outputPort.connections[0];
        let leastNum = Number.MAX_VALUE;
        for(let conn of this.outputPort.connections){
            let length = allConnections.filter(x => x==conn).length;
            if(length < leastNum){
                least = conn;
                leastNum = length;
            }
        }
        data.origin = least;
        data.originID = this.originID;
        this.streamConnectionTable[data.requestId] = data.origin;
        await this.outputPort.sendData(data, least);
    }

    async urlHash(data: RequestData){
        let url: string;
        if(data.header.endpoint.endpoint == null) 
            url = "/";
        else 
            url = data.header.endpoint.endpoint.url;
        let hash = objectHash({id:url}).substr(0,2);
        let hashInt = parseInt(hash,16);
        let length = this.outputPort.connections.length;
        let connectionIndex = hashInt % length;
        data.origin = this.outputPort.connections[connectionIndex];
        data.originID = this.originID;
        this.streamConnectionTable[data.requestId] = data.origin;
        await this.outputPort.sendData(data, this.outputPort.connections[connectionIndex]);
    }

    onConnectionUpdate(wasOutput: boolean = false){}

    /**
     * 
     * This method currently does nothing for LoadBalancer
     */
    sendData(request: RequestData): void {}

    getAvailableEndpoints(): Endpoint[]{
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
}

export class LoadBalancerOptions extends Options{
    type: LoadBalancerType = LoadBalancerType["Layer 7"];
    algorithm: BalancingAlgorithm = BalancingAlgorithm["Round Robin"];
}

