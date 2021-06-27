import { Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { API } from 'src/models/API';
import { Endpoint, EndpointAction, MQEndpoint } from 'src/models/Endpoint';
import { OperatorComponent } from '../Shared/OperatorComponent';
import { EndpointActionHTTPMethod, HTTPMethod } from 'src/models/enums/HTTPMethod';
import { Protocol } from 'src/models/enums/Protocol';
import { APIType } from 'src/models/enums/APIType';
import { gRPCMode } from 'src/models/enums/gRPCMode';
import { ChangesService } from 'src/app/changes.service';

@Component({
	selector: 'api',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
	},
	templateUrl: './api.component.html',
	styleUrls: ['./api.component.scss']
})
export class ApiComponent  extends OperatorComponent implements OnInit{

	public LogicApi: API = new API();
	
	@ViewChild("conn", { read: ViewContainerRef }) conn;

	connectableEndpoints: Endpoint[] = [];
	consumeableEndpoints: Endpoint[] = [];

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver, changesService: ChangesService){
		super(placingService, selectionService, resolver, changesService);
	}

	addAction(endpoint: Endpoint){
		endpoint.actions.push(new EndpointAction());
	}

	removeAction(endpoint: Endpoint, action: EndpointAction){
		let idx = 0;
		for(let act of endpoint.actions){
			if(act === action) {
				endpoint.actions.splice(idx,1);
				return;
			}
			idx++;
		}
	}

	addEndpoint(){
		if(this.LogicApi.options.isConsumer)
			this.LogicApi.options.endpoints.push(new Endpoint(null, [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.DELETE, HTTPMethod.PATCH]));
		else
			this.LogicApi.options.endpoints.push(new Endpoint(null, [HTTPMethod.GET]));
	}

	removeEndpoint(endpoint: Endpoint){
		let idx = 0;
		for(let ep of this.LogicApi.options.endpoints){
			if(ep === endpoint) {
				this.LogicApi.options.endpoints.splice(idx,1);
				return;
			}
			idx++;
		}	
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
			endpoint.url = `api/v${Math.floor(10*Math.random())}`;
	}

	public handleClick(){
		super.handleClick();
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
		if(this.LogicApi.options.isConsumer){ // Remove consumed endpoint that are no longer available
			this.consumeableEndpoints = this.LogicApi.getConsumableEndpoints();
			let idx_arr = [];
			for(let i = 0; i < this.LogicApi.options.endpoints.length; i++){
				let endpoint = this.LogicApi.options.endpoints[i];
				let ep = this.consumeableEndpoints.find(x => x.url == endpoint.url);
				if(ep == null) 
					idx_arr.push(i);
			}
			for(let i = idx_arr.length-1; i>=0 ;i--)
				this.LogicApi.options.endpoints.splice(idx_arr[i], 1);
		}
	}

	public handleProtocolChange(endpoint: Endpoint){
		if(endpoint.protocol == Protocol.WebSockets)
			endpoint.supportedMethods = [HTTPMethod.GET];
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

	ngAfterViewInit(): void {
		super.Init(this.conn);
  	}

	public getLogicComponent(){
		return this.LogicApi;
	}

	getActionsElement(){
		return null;
	}

	ngOnInit(){}
}