import { Endpoint } from "./Endpoint"
import { Options } from "./Options";
import { Port } from "./Port";

export class EndpointOperator {
    outputPort: Port;
    options: EndpointOptions;

    getConnectableEndpoints() : Endpoint[]{
        let endpoints :Endpoint[] = [];
        for(let connection of this.outputPort.connections){
            connection.getOtherPort(this.outputPort).parent.getAvailableEndpoints().forEach(x=>{
                let has = false;
                for(let y of endpoints){
                    if(y.url===x.url){
                        has = true;
                        break;
                    } 
                }
                if(!has)endpoints.push(x);
            });        
        }
        return endpoints;
    }

}

export class EndpointOptions extends Options{
    endpoints: Endpoint[] = [];
}