import { Component, Input, OnInit } from '@angular/core';
import { Endpoint, EndpointAction } from 'src/models/Endpoint';
import { EndpointOperator } from 'src/models/EndpointOperator';
import { APIType } from 'src/models/enums/APIType';
import { gRPCMode } from 'src/models/enums/gRPCMode';
import { EndpointActionHTTPMethod, HTTPMethod } from 'src/models/enums/HTTPMethod';
import { Protocol } from 'src/models/enums/Protocol';
import { getFormattedMethod } from 'src/shared/ExtensionMethods';

@Component({
	selector: 'endpoint-select',
	templateUrl: './endpoint-select.component.html',
	styleUrls: ['./endpoint-select.component.scss']
})
export class EndpointSelectComponent implements OnInit {

	@Input() Model: EndpointOperator;
	@Input() Type: APIType = APIType.REST;
	@Input() Multiple: boolean = true;
	@Input() HasActions: boolean = true;
	@Input() HasStreamActions: boolean = false;
	@Input() ModifiableMethods: boolean = true;
	@Input() ConnectableEndpoints: Endpoint[] = [];
	@Input() DatabaseEndpoints: boolean = false;
	@Input() AfterChange;
	@Input() Title: string = "Endpoints: ";
	@Input() ShowCounter: boolean = false;
	@Input() Property: string = "endpoints";

	public HTTPMethod: typeof HTTPMethod = HTTPMethod;
	public HTTPMethodKeys = Object.values(HTTPMethod).filter(k => !isNaN(Number(k)));
	public EndpointActionHTTPMethod: typeof EndpointActionHTTPMethod = EndpointActionHTTPMethod;
	public EndpointActionHTTPMethodKeys = Object.values(EndpointActionHTTPMethod).filter(k => !isNaN(Number(k)));
	public Protocol: typeof Protocol = Protocol;
	public ProtocolKeys = Object.values(Protocol).filter(k => !isNaN(Number(k)));
	public APIType: typeof APIType = APIType;
	public APITypeKeys = Object.values(APIType).filter(k => !isNaN(Number(k)));
	public gRPCMode: typeof gRPCMode = gRPCMode;
	public gRPCModeKeys = Object.values(gRPCMode).filter(k => !isNaN(Number(k)));

	constructor() { }

	ngOnInit(): void {

	}

	formatMethod(method: HTTPMethod, isDatabase: boolean){
		return getFormattedMethod(method, isDatabase);
	}

	handleActionEndpointChange(endpoint: Endpoint, action: EndpointAction){
		action.method = endpoint.protocol != Protocol.WebSockets && action.endpoint.protocol != Protocol.WebSockets ? EndpointActionHTTPMethod.Inherit : EndpointActionHTTPMethod[HTTPMethod[action.endpoint.supportedMethods[0]]];
	}

	handleEndpointMethodChange(endpoint: Endpoint){
		if(endpoint.supportedMethods.length == 0)
			endpoint.supportedMethods = [HTTPMethod.GET];
	}

	handleEndpointUrlChange(endpoint){
		if(endpoint.url == null || endpoint.url.replace(/\s/g,"") == "")
			endpoint.url = `/endpoint/v${Math.floor(10*Math.random())}`;
	}

	addAction(endpoint: Endpoint){
		endpoint.actions.push(new EndpointAction());
		this.AfterChange();
	}

	removeAction(endpoint: Endpoint, action: EndpointAction){
		let idx = 0;
		for(let act of endpoint.actions){
			if(act === action) {
				endpoint.actions.splice(idx,1);
				this.AfterChange();
				return;
			}
			idx++;
		}
	}

	addEndpoint(){
		let type = this.Type;
		let endpoint: Endpoint;
		if(type == APIType.REST){
			endpoint = new Endpoint("/endpoint",[HTTPMethod.GET,HTTPMethod.POST,HTTPMethod.PUT,HTTPMethod.DELETE]);
		}
		else if(type == APIType.GraphQL){
			endpoint = new Endpoint("/endpoint",[HTTPMethod.GET,HTTPMethod.POST]);
		}
		else if(type == APIType.RPC){
			endpoint = new Endpoint("/endpoint",[HTTPMethod.GET]);
		}
		else if(type == APIType.gRPC){
			endpoint = new Endpoint("/endpoint",[HTTPMethod.GET]);
			endpoint.grpcMode = gRPCMode.Unary;
		}
		else if(type == APIType.WebSockets){
			endpoint = new Endpoint("/endpoint", [HTTPMethod.GET]);
			endpoint.protocol = Protocol.WebSockets;
		}
		this.Model.options[this.Property].push(endpoint);		
		this.AfterChange();
	}

	removeEndpoint(endpoint: Endpoint){
		let idx = 0;
		for(let ep of this.Model.options[this.Property]){
			if(ep === endpoint) {
				this.Model.options[this.Property].splice(idx,1);
				this.AfterChange();
				return;
			}
			idx++;
		}	
	}
}
