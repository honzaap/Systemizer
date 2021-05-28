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
import { APIGateway } from 'src/models/APIGateway';

@Component({
	selector: 'apigateway',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		inputPortRef: new ViewChild("inputPort"),
		outputPortRef: new ViewChild("outputPort")
	},
	templateUrl: './apigateway.component.html',
	styleUrls: ['./apigateway.component.scss']
})
export class ApiGatewayComponent  extends OperatorComponent implements OnInit{

	// Logic
	public LogicApiGateway : APIGateway = new APIGateway();
	data : RequestData;

	connectableEndpoints: Endpoint[];

	constructor(placingService: PlacingService, selectionService: SelectionService) 
	{
		super(placingService, selectionService);
		this.LogicApiGateway.onReceiveData((data:RequestData)=>{
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

	addRestEndpoint(){
		this.LogicApiGateway.options.restEndpoints.push(new Endpoint("api/posts", [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.DELETE, ]));
	}
	addRpcEndpoint(){
		this.LogicApiGateway.options.rpcEndpoints.push(new Endpoint("api/getPosts", [HTTPMethod.GET]));
	}
	addGrpcEndpoint(){
		this.LogicApiGateway.options.grpcEndpoints.push(new Endpoint("api/getPosts", [HTTPMethod.GET]));
	}
	addGraphqlEndpoint(){
		this.LogicApiGateway.options.graphqlEndpoints.push(new Endpoint("/graphql", [HTTPMethod.GET, HTTPMethod.POST]));
	}
	addWebsocketsEndpoint(){
    let wsEp = new Endpoint("api/sendMessage", [HTTPMethod.GET]);
    wsEp.protocol = Protocol.WebSockets;
		this.LogicApiGateway.options.websocketsEndpoints.push(wsEp);
	}

	removeRestEndpoint(endpoint: Endpoint){
		let idx = 0;
		for(let ep of this.LogicApiGateway.options.restEndpoints){
			if(ep === endpoint) this.LogicApiGateway.options.restEndpoints.splice(idx,1);
			idx++;
		}	
	}
	removeRpcEndpoint(endpoint: Endpoint){
		let idx = 0;
		for(let ep of this.LogicApiGateway.options.rpcEndpoints){
			if(ep === endpoint) this.LogicApiGateway.options.rpcEndpoints.splice(idx,1);
			idx++;
		}	
	}
	removeGrpcEndpoint(endpoint: Endpoint){
		let idx = 0;
		for(let ep of this.LogicApiGateway.options.grpcEndpoints){
			if(ep === endpoint) this.LogicApiGateway.options.grpcEndpoints.splice(idx,1);
			idx++;
		}	
	}
	removeGraphqlEndpoint(endpoint: Endpoint){
		this.LogicApiGateway.options.graphqlEndpoints = [];
	}
	removeWebsocketsEndpoint(endpoint: Endpoint){
		let idx = 0;
		for(let ep of this.LogicApiGateway.options.websocketsEndpoints){
			if(ep === endpoint) this.LogicApiGateway.options.websocketsEndpoints.splice(idx,1);
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

	public handleClick(){
		super.handleClick();
		this.connectableEndpoints = this.LogicApiGateway.getConnectableEndpoints();
		for(let j = 0; j < this.LogicApiGateway.options.endpoints.length; j++){
			let endpoint = this.LogicApiGateway.options.endpoints[j]
			for(let i = 0; i < endpoint.actions.length; i++){
				let action = endpoint.actions[i];
				let currEdp = action.endpoint;
				let currMth = action.method;
				this.LogicApiGateway.options.endpoints[j].actions[i].endpoint = null;
				if(this.connectableEndpoints.length == 0){
					this.connectableEndpoints = [];
					endpoint.actions = [];
					return;
				}
				if(currEdp != null && currMth != null){
					for(let e of this.connectableEndpoints){ // need this workaround to keep values in material select....
						if(e.url == currEdp.url){
							this.LogicApiGateway.options.endpoints[j].actions[i].endpoint = e;
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
		let type = this.LogicApiGateway.options.type;
		if(type == APIType.REST){
			let restEp = new Endpoint("api/posts",[HTTPMethod.GET,HTTPMethod.POST,HTTPMethod.PUT,HTTPMethod.DELETE]);
			this.LogicApiGateway.options.endpoints = [restEp]
		}
		else if(type == APIType.GraphQL){
			let gqlEp = new Endpoint("/graphql",[HTTPMethod.GET,HTTPMethod.POST]);
			this.LogicApiGateway.options.endpoints = [gqlEp]
		}
		else if(type == APIType.RPC){
			let rpcEp = new Endpoint("api/getPosts",[HTTPMethod.GET]);
			this.LogicApiGateway.options.endpoints = [rpcEp]
		}
		else if(type == APIType.gRPC){
			let grpcEp = new Endpoint("api/getPosts",[HTTPMethod.GET]);
			grpcEp.grpcMode = gRPCMode.Unary;
			this.LogicApiGateway.options.endpoints = [grpcEp]
		}
    else if(type == APIType.WebSockets){
			let wsEp = new Endpoint("api/sendMessage", [HTTPMethod.GET]);
			wsEp.protocol = Protocol.WebSockets;
			this.LogicApiGateway.options.endpoints = [wsEp];
		}
	}

	destroySelf = () => {
		super.destroySelf();
		this.LogicApiGateway.destroy();
		this.destroyComponent();
	}


	ngAfterViewInit(): void {
		super.Init();
  	}

	public getLogicComponent(){
		return this.LogicApiGateway;
	}

	getActionsElement(){
		return null;
	}

	ngOnInit(){

	}

}
