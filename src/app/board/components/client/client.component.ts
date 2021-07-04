import { Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Client } from 'src/models/Client';
import { Endpoint } from 'src/models/Endpoint';
import { gRPCMode } from 'src/models/enums/gRPCMode';
import { HTTPMethod } from 'src/models/enums/HTTPMethod';
import { Protocol } from 'src/models/enums/Protocol';
import { RequestData, RequestDataHeader } from 'src/models/RequestData';
import { arrayEquals, sleep, UUID } from 'src/shared/ExtensionMethods';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'client',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		actionsRef: new ViewChild("actions")
	},
	templateUrl: './client.component.html',
	styleUrls: ['./client.component.scss']
})
export class ClientComponent  extends OperatorComponent implements OnInit{

	public LogicClient : Client = new Client();

	availableEndpoints: Endpoint[] = [];
	availableMethods: HTTPMethod[] = [];
	protocol: Protocol;
	canAutoSend: boolean = true;

	canSend: boolean = false;
	canEstabilishConnection: boolean = false;
	canEndConnection: boolean = false;

	@ViewChild("endpointSelect") endpointSelect;
	@ViewChild("methodSelect") methodSelect;
	@ViewChild("conn", { read: ViewContainerRef }) conn;

	isAutomaticSending = false;

	constructor(placingService: PlacingService, selectionService: SelectionService ,resolver: ComponentFactoryResolver){
		super(placingService, selectionService, resolver);
	}

	ngAfterViewInit(): void {
		super.Init(this.conn);
  	}

	ngOnInit(){}

	handleEndpointChange(){
		this.LogicClient.options.endpointRef.method = this.LogicClient.options.endpointRef.endpoint.supportedMethods[0];
		this.availableMethods = this.endpointSelect.value.supportedMethods;
		this.protocol = this.LogicClient.options.endpointRef.endpoint.protocol;
		this.afterChange();
	}

	updateSelection(){
		this.LogicClient.updateEndpoint();
		let currEdp = this.endpointSelect.value as Endpoint;
		let currMth = this.methodSelect.value;
		this.LogicClient.options.endpointRef.endpoint = null;
		this.endpointSelect.value = null;
		this.availableEndpoints = this.LogicClient.getAvailableEndpoints();
		if(this.availableEndpoints.length == 0){
			this.availableMethods = [];
			this.updateCanSendData();
			this.updateCanEstabilishStream();
			this.updateCanEndStream();
			return;
		}
		if(currEdp != null && currMth != null){
			let was = false;
			for(let e of this.availableEndpoints){ // need this workaround to keep values in material select....
				if(e.url == currEdp.url && arrayEquals(e.supportedMethods,currEdp.supportedMethods)){
					was = true;
					this.LogicClient.options.endpointRef.endpoint = e;
					this.endpointSelect.value = e;
					this.availableMethods = e.supportedMethods;
				}
			}
			this.LogicClient.options.endpointRef.method = currMth;
			if(!was){
				this.LogicClient.options.endpointRef.endpoint = this.availableEndpoints[0];
				this.availableMethods = this.LogicClient.options.endpointRef.endpoint.supportedMethods;
				this.LogicClient.options.endpointRef.method = this.availableMethods[0];
			}
		}
		else{
			this.LogicClient.options.endpointRef.endpoint = this.availableEndpoints[0];
			this.availableMethods = this.LogicClient.options.endpointRef.endpoint.supportedMethods;
			this.LogicClient.options.endpointRef.method = this.availableMethods[0];
		}
		this.protocol = this.LogicClient.options.endpointRef.endpoint.protocol;
		this.updateCanSendData();
		this.updateCanEstabilishStream();
		this.updateCanEndStream();
	}

	public handleClick(){
		super.handleClick();
		this.updateSelection();
	}

	public getLogicComponent(){
		return this.LogicClient;
	}

	async toggleAutomaticSend(){
		this.isAutomaticSending = !this.isAutomaticSending;
		if(this.isAutomaticSending){
			if(this.canAutoSend){
				this.canAutoSend = false;
				this.canAutoSend = await this.stream();
			}
		}
	}

	updateCanSendData(){
		if(this.LogicClient.options.endpointRef.endpoint == null) {
			this.canSend = false;
			return;
		}
		this.canSend = this.LogicClient.options.endpointRef.endpoint.grpcMode != gRPCMode['Server Streaming'] && 
			this.LogicClient.isConnectedToEndpoint || 
			this.LogicClient.options.endpointRef.endpoint.grpcMode == gRPCMode.Unary && this.LogicClient.options.endpointRef.endpoint.protocol != Protocol.WebSockets;
	}

	updateCanEstabilishStream(){
		this.canEstabilishConnection = this.LogicClient.options.endpointRef.endpoint != null && 
		(this.LogicClient.options.endpointRef.endpoint.grpcMode != gRPCMode.Unary || 
		this.LogicClient.options.endpointRef.endpoint.protocol == Protocol.WebSockets) && 
		!this.LogicClient.isConnectedToEndpoint
	}

	updateCanEndStream(){
		this.canEndConnection = this.LogicClient.options.endpointRef.endpoint != null && 
		(this.LogicClient.options.endpointRef.endpoint.grpcMode != gRPCMode.Unary || 
		this.LogicClient.options.endpointRef.endpoint.protocol == Protocol.WebSockets) && 
		this.LogicClient.isConnectedToEndpoint
	}

	async stream(){
		await sleep(700);
		this.updateCanSendData()
		if(!this.isAutomaticSending || !this.canSend) 
			return true;
		await this.sendData();
		return await this.stream();
	}

	async sendData(){
		let request = new RequestData();

		request.header = new RequestDataHeader(this.LogicClient.options.endpointRef, this.LogicClient.options.protocol)
		request.origin = this.LogicClient.outputPort.connections[0];
		request.originID = this.LogicClient.originID;
		if(this.LogicClient.connectedId != null) {
			request.requestId = this.LogicClient.connectedId;
			request.header.stream = true;
		}
		else
			request.requestId = UUID();
		let res = this.LogicClient.sendData(request);
		this.updateSelection();
		if(! (await res)){
			this.isAutomaticSending = false;
			this.canAutoSend = true;
		}
	}

	estabilishConnection(){
		if(this.LogicClient.isConnectedToEndpoint) 
			return;
		this.LogicClient.isConnectedToEndpoint = true;
		
		let id = UUID();
		let request = new RequestData();
		request.header = new RequestDataHeader(this.LogicClient.options.endpointRef, this.LogicClient.options.protocol, true);
		request.origin = this.LogicClient.outputPort.connections[0];
		request.originID = this.LogicClient.originID;
		request.requestId = id;
		this.LogicClient.connectedId = id;
		this.LogicClient.sendData(request);

		this.updateSelection();
	}

	async endConnection(){
		if(!this.LogicClient.isConnectedToEndpoint) 
			return;
		
		let id = this.LogicClient.connectedId;
		if(id == null) 
			return;
		let request = new RequestData();
		request.header = new RequestDataHeader(this.LogicClient.options.endpointRef, this.LogicClient.options.protocol, false);
		request.origin = this.LogicClient.outputPort.connections[0];
		request.originID = this.LogicClient.originID;
		request.requestId = id;
		this.LogicClient.connectedId = null;
		this.canAutoSend = true;
		this.isAutomaticSending = false;
		await this.LogicClient.sendData(request);
		this.LogicClient.isConnectedToEndpoint = false;

		this.updateSelection();
	}
}
