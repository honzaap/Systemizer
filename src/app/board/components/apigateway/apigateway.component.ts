import { Component, OnInit } from '@angular/core';
import { APIGateway } from 'src/models/APIGateway';
import { Endpoint } from 'src/models/Endpoint';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'apigateway',
	templateUrl: './apigateway.component.html',
	styleUrls: ['./apigateway.component.scss']
})
export class ApiGatewayComponent  extends OperatorComponent implements OnInit{

	public LogicApiGateway : APIGateway = new APIGateway();

	connectableEndpoints: Endpoint[];

	public handleClick(event: MouseEvent){
		super.handleClick(event);
		this.updateSelection();
	}

	updateSelection(){
		this.connectableEndpoints = this.LogicApiGateway.getConnectableEndpoints();
		let endpoints = this.LogicApiGateway.getEndpoints();
		for(let j = 0; j < endpoints.length; j++){
			let endpoint = endpoints[j]
			for(let i = 0; i < endpoint.actions.length; i++){
				let action = endpoint.actions[i];
				let currEdp = action.endpoint;
				let currMth = action.method;
				endpoints[j].actions[i].endpoint = null;
				if(this.connectableEndpoints.length == 0){
					this.connectableEndpoints = [];
					endpoint.actions = [];
					return;
				}
				if(currEdp != null && currMth != null){
					for(let e of this.connectableEndpoints){ // need this workaround to keep values in material select....
						if(e.url == currEdp.url)
							endpoints[j].actions[i].endpoint = e;
					}
					endpoint.actions[i].method = currMth;
				}
				else
					endpoint.actions.splice(i,1);
			}
		}
	}

	public getLogicComponent(){
		return this.LogicApiGateway;
	}

	static getColor(): string{
		let c = new APIGateway();
		return c.color;
	}
}