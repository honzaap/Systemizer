import { Endpoint } from "./Endpoint"
import { LogicComponent } from "./LogicComponent";
import { Options } from "./Options";
import { Port } from "./Port";

export class EndpointOperator extends LogicComponent{
    constructor() {
        super();
    }

    outputPort: Port;
    options: EndpointOptions;

    getConnectableEndpoints() : Endpoint[]{
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

export class EndpointOptions extends Options{
    endpoints: Endpoint[] = [];
}