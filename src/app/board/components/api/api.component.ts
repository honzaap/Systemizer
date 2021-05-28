import { Component, OnInit, ViewChild } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { API } from 'src/models/API';
import { Endpoint, EndpointAction, EndpointRef } from 'src/models/Endpoint';
import { RequestData } from 'src/models/RequestData';
import { OperatorComponent } from '../Shared/OperatorComponent';
import { EndpointActionHTTPMethod, HTTPMethod } from 'src/models/enums/HTTPMethod';
import { Protocol } from 'src/models/enums/Protocol';
import { HTTPStatus } from 'src/models/enums/HTTPStatus';
import { APIType } from 'src/models/enums/APIType';
import { gRPCMode } from 'src/models/enums/gRPCMode';

@Component({
	selector: 'api',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		inputPortRef: new ViewChild("inputPort"),
		outputPortRef: new ViewChild("outputPort")
	},
	templateUrl: './api.component.html',
	styleUrls: ['./api.component.scss']
})
export class ApiComponent  extends OperatorComponent implements OnInit{

	// Logic
	public LogicApi : API = new API();
	data : RequestData;

	connectableEndpoints: Endpoint[];

	constructor(placingService: PlacingService, selectionService: SelectionService) 
	{
		super(placingService, selectionService);
		this.LogicApi.onReceiveData((data:RequestData)=>{
			this.data = data;
			if(!this.comp.classList.contains("anim"))
			{
			  this.comp.classList.add("anim");
			  setTimeout(()=>{
				this.comp.classList.remove("anim");
			  },500);
			}
		});
	}

	addAction(endpoint: Endpoint){
		endpoint.actions.push(new EndpointAction());
	}

	removeAction(endpoint: Endpoint, action: EndpointAction){
		let idx = 0;
		for(let act of endpoint.actions){
			if(act === action) endpoint.actions.splice(idx,1);
			idx++;
		}
	}

	addEndpoint(){
		this.LogicApi.options.endpoints.push(new Endpoint(null, [HTTPMethod.GET]));
	}

	removeEndpoint(endpoint: Endpoint){
		let idx = 0;
		for(let ep of this.LogicApi.options.endpoints){
			if(ep === endpoint) this.LogicApi.options.endpoints.splice(idx,1);
			idx++;
		}	
	}

	handleActionEndpointChange(endpoint: Endpoint, action: EndpointAction){
		action.method = endpoint.protocol != Protocol.WebSockets && action.endpoint.protocol != Protocol.WebSockets ? EndpointActionHTTPMethod.Inherit : EndpointActionHTTPMethod[HTTPMethod[action.endpoint.supportedMethods[0]]];
	}

	handleEndpointMethodChange(endpoint: Endpoint){
		if(endpoint.supportedMethods.length == 0){
			endpoint.supportedMethods = [HTTPMethod.GET];
		}
	}

	handleEndpointUrlChange(endpoint){
		if(endpoint.url == null || endpoint.url.replace(/\s/g,"") == ""){
			endpoint.url = `api/v${Math.floor(10*Math.random())}`
		}
	}

	test(){
		console.log(this.LogicApi.options.endpoints);
	}

	public handleClick(){
		super.handleClick();
		this.connectableEndpoints = this.LogicApi.getConnectableEndpoints();
		for(let j = 0; j < this.LogicApi.options.endpoints.length; j++){
			let endpoint = this.LogicApi.options.endpoints[j]
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
						if(e.url == currEdp.url){
							this.LogicApi.options.endpoints[j].actions[i].endpoint = e;
						}
					}
					endpoint.actions[i].method = currMth;
				}
				else{
					endpoint.actions.splice(i,1);
				}
			}
		}
	}

	public handleProtocolChange(endpoint: Endpoint){
		if(endpoint.protocol == Protocol.WebSockets){
			endpoint.supportedMethods = [HTTPMethod.GET];
		}
	}

	public handleTypeChange(){
		let type = this.LogicApi.options.type;
		if(type == APIType.REST){
			let restEp = new Endpoint("api/posts",[HTTPMethod.GET,HTTPMethod.POST,HTTPMethod.PUT,HTTPMethod.DELETE]);
			this.LogicApi.options.endpoints = [restEp]
		}
		else if(type == APIType.GraphQL){
			let gqlEp = new Endpoint("/graphql",[HTTPMethod.GET,HTTPMethod.POST]);
			this.LogicApi.options.endpoints = [gqlEp]
		}
		else if(type == APIType.RPC){
			let rpcEp = new Endpoint("api/getPosts",[HTTPMethod.GET]);
			this.LogicApi.options.endpoints = [rpcEp]
		}
		else if(type == APIType.gRPC){
			let grpcEp = new Endpoint("api/getPosts",[HTTPMethod.GET]);
			grpcEp.grpcMode = gRPCMode.Unary;
			this.LogicApi.options.endpoints = [grpcEp]
		}
		else if(type == APIType.WebSockets){
			let wsEp = new Endpoint("api/sendMessage", [HTTPMethod.GET]);
			wsEp.protocol = Protocol.WebSockets;
			this.LogicApi.options.endpoints = [wsEp];
		}
	}

	destroySelf = () => {
		super.destroySelf();
		this.LogicApi.destroy();
		this.destroyComponent();
	}


	ngAfterViewInit(): void {
		super.Init();
  	}

	public getLogicComponent(){
		return this.LogicApi;
	}

	getActionsElement(){
		return null;
	}

	ngOnInit(){

	}
}
