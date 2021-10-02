import { Component, OnInit } from '@angular/core';
import { API } from 'src/models/API';
import { Endpoint } from 'src/models/Endpoint';
import { APIType } from 'src/models/enums/APIType';
import { gRPCMode } from 'src/models/enums/gRPCMode';
import { HTTPMethod } from 'src/models/enums/HTTPMethod';
import { Protocol } from 'src/models/enums/Protocol';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'api',
	templateUrl: './api.component.html',
	styleUrls: ['./api.component.scss']
})
export class ApiComponent  extends OperatorComponent implements OnInit{

	public LogicApi: API = new API();
	
	connectableEndpoints: Endpoint[] = [];
	
	public handleClick(event: MouseEvent){
		super.handleClick(event);
		this.updateSelection();
	}

	updateSelection(){
		this.connectableEndpoints = this.LogicApi.getConnectableEndpoints();
		for(let j = 0; j < this.LogicApi.options.endpoints.length; j++){
			let endpoint = this.LogicApi.options.endpoints[j];
			for(let i = 0; i < endpoint.actions.length; i++){
				let action = endpoint.actions[i];
				let currEdp = action.endpoint;
				let currMth = action.method;
				this.LogicApi.options.endpoints[j].actions[i].endpoint = null;
				if(this.connectableEndpoints.length == 0){
					this.connectableEndpoints = [];
					endpoint.actions = [];
					return;
				}
				if(currEdp != null && currMth != null){
					for(let e of this.connectableEndpoints){ // need this workaround to keep values in material select....
						if(e.url == currEdp.url)
							this.LogicApi.options.endpoints[j].actions[i].endpoint = e;
					}
					endpoint.actions[i].method = currMth;
				}
				else
					endpoint.actions.splice(i,1);
			}
		}
	}

	public handleTypeChange(){
		let type = this.LogicApi.options.type;
		let endpoint: Endpoint;
		if(type == APIType.REST){
			endpoint = new Endpoint("api/posts",[HTTPMethod.GET,HTTPMethod.POST,HTTPMethod.PUT,HTTPMethod.DELETE]);
		}
		else if(type == APIType.GraphQL){
			endpoint = new Endpoint("/graphql",[HTTPMethod.GET,HTTPMethod.POST]);
		}
		else if(type == APIType.RPC){
			endpoint = new Endpoint("api/getPosts",[HTTPMethod.GET]);
		}
		else if(type == APIType.gRPC){
			endpoint = new Endpoint("api/getPosts",[HTTPMethod.GET]);
			endpoint.grpcMode = gRPCMode.Unary;
		}
    	else if(type == APIType.WebSockets){
			endpoint = new Endpoint("api/sendMessage", [HTTPMethod.GET]);
			endpoint.protocol = Protocol.WebSockets;
		}
		this.LogicApi.options.endpoints = [endpoint];
	}

	public getLogicComponent(){
		return this.LogicApi;
	}

	static getColor(): string{
		let c = new API();
		return c.color;
	}
}