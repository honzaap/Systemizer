import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Endpoint, EndpointAction } from 'src/models/Endpoint';
import { APIType } from 'src/models/enums/APIType';
import { gRPCMode } from 'src/models/enums/gRPCMode';
import { EndpointActionHTTPMethod, HTTPMethod } from 'src/models/enums/HTTPMethod';
import { Protocol } from 'src/models/enums/Protocol';
import { WebServer } from 'src/models/WebServer';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'webserver',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
	},
	templateUrl: './webserver.component.html',
	styleUrls: ['./webserver.component.scss']
})
export class WebserverComponent extends OperatorComponent implements OnInit {

	public LogicWebServer : WebServer = new WebServer();
	@ViewChild("conn", { read: ViewContainerRef }) conn;

	connectableEndpoints: Endpoint[] = [];

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver, cdRef: ChangeDetectorRef){
		super(placingService, selectionService, resolver, cdRef);
  	}

	addAction(endpoint: Endpoint){
		endpoint.actions.push(new EndpointAction());
		this.afterChange();
	}

	removeAction(endpoint: Endpoint, action: EndpointAction){
		let idx = 0;
		for(let act of endpoint.actions){
			if(act === action) {
				endpoint.actions.splice(idx,1);
				this.afterChange();
				return;
			}
			idx++;
		}
	}

	addEndpoint(){
		let type = this.LogicWebServer.options.type;
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
		this.LogicWebServer.options.endpoints.push(endpoint);		
		this.afterChange();
	}

	removeEndpoint(endpoint: Endpoint){
		let idx = 0;
		for(let ep of this.LogicWebServer.options.endpoints){
			if(ep === endpoint) {
				this.LogicWebServer.options.endpoints.splice(idx,1);
				this.afterChange();
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

	public handleClick(event: MouseEvent){
		super.handleClick(event);
		this.updateSelection();
	}

	isServerStreaming(endpoint: Endpoint){
		return endpoint.grpcMode == gRPCMode['Server Streaming']
	}

	updateSelection(){
		this.connectableEndpoints = this.LogicWebServer.getConnectableEndpoints();
		for(let j = 0; j < this.LogicWebServer.options.endpoints.length; j++){
			let endpoint = this.LogicWebServer.options.endpoints[j];
			for(let i = 0; i < endpoint.actions.length; i++){
				let action = endpoint.actions[i];
				let currEdp = action.endpoint;
				let currMth = action.method;
				this.LogicWebServer.options.endpoints[j].actions[i].endpoint = null;
				if(this.connectableEndpoints.length == 0){
					this.connectableEndpoints = [];
					endpoint.actions = [];
					return;
				}
				if(currEdp != null && currMth != null){
					for(let e of this.connectableEndpoints){ // need this workaround to keep values in material select....
						if(e.url == currEdp.url)
							this.LogicWebServer.options.endpoints[j].actions[i].endpoint = e;
					}
					endpoint.actions[i].method = currMth;
				}
				else
					endpoint.actions.splice(i,1);
			}
		}
	}

	public handleProtocolChange(endpoint: Endpoint){
		if(endpoint.protocol == Protocol.WebSockets)
			endpoint.supportedMethods = [HTTPMethod.GET];
	}

	public handleTypeChange(){
		let type = this.LogicWebServer.options.type;
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
		this.LogicWebServer.options.endpoints = [endpoint];
	}

	ngAfterViewInit(): void {
		super.Init(this.conn);
	}

	ngOnInit(){
		this.cdRef.detectChanges();
	}

	getActionsElement(){
		return null;
	}

	public getLogicComponent(){
		return this.LogicWebServer;
	}

	static getColor(): string{
		let c = new WebServer();
		return c.color;
	}
}