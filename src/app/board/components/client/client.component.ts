import { ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Client } from 'src/models/Client';
import { Endpoint } from 'src/models/Endpoint';
import { gRPCMode } from 'src/models/enums/gRPCMode';
import { HTTPMethod } from 'src/models/enums/HTTPMethod';
import { HTTPStatus } from 'src/models/enums/HTTPStatus';
import { Protocol } from 'src/models/enums/Protocol';
import { RequestData } from 'src/models/RequestData';
import { arrayEquals, sleep, UUID } from 'src/shared/ExtensionMethods';
import { OperatorComponent } from '../Shared/OperatorComponent';



@Component({
	selector: 'client',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		actionsRef: new ViewChild("actions"),
		inputPortRef: new ViewChild("inputPort"),
		outputPortRef: new ViewChild("outputPort")
	},
	templateUrl: './client.component.html',
	styleUrls: ['./client.component.scss']
})
export class ClientComponent  extends OperatorComponent implements OnInit{

	// Logic
	public LogicClient : Client = new Client();
	data : RequestData;

	availableEndpoints: Endpoint[] = [];
	availableMethods: HTTPMethod[] = [];
	protocol: Protocol;
	canAutoSend: boolean = true;

	@ViewChild("endpointSelect") endpointSelect;
	@ViewChild("methodSelect") methodSelect;

	isAutomaticSending = false;

	constructor(placingService: PlacingService, selectionService: SelectionService) 
	{
		super(placingService, selectionService);
		this.LogicClient.onReceiveData((data:RequestData)=>{
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

	ngAfterViewInit(): void {
		super.Init();
  	}

	ngOnInit(){
	}

	handleEndpointChange(){
		this.LogicClient.options.endpointRef.method = this.LogicClient.options.endpointRef.endpoint.supportedMethods[0];
		this.availableMethods = this.endpointSelect.value.supportedMethods;
		this.protocol = this.LogicClient.options.endpointRef.endpoint.protocol;
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
	}

	public handleClick(){
		super.handleClick();
		this.updateSelection();
	}

	public getLogicComponent(){
		return this.LogicClient;
	}

	destroySelf = () => {
		super.destroySelf();
		this.LogicClient.destroy();
		this.destroyComponent();
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

	canSendData(){
		let result = !(this.LogicClient.options.endpointRef.endpoint == null || 
		((this.LogicClient.options.endpointRef.endpoint.grpcMode == gRPCMode['Server Streaming']) || 
		(this.LogicClient.options.endpointRef.endpoint.grpcMode == gRPCMode['Client Streaming'] ||
		this.LogicClient.options.endpointRef.endpoint.grpcMode == gRPCMode['Bidirectional Streaming'] || 
		this.LogicClient.options.endpointRef.endpoint.protocol == Protocol.WebSockets) && 
		!this.LogicClient.options.isConnectedToEndpoint));
		return result;
	}

	canEstabilishStream(){
		return this.LogicClient.options.endpointRef.endpoint != null && 
		(this.LogicClient.options.endpointRef.endpoint.grpcMode == gRPCMode['Client Streaming'] || 
		this.LogicClient.options.endpointRef.endpoint.grpcMode == gRPCMode['Server Streaming'] || 
		this.LogicClient.options.endpointRef.endpoint.grpcMode == gRPCMode['Bidirectional Streaming'] ||
		this.LogicClient.options.endpointRef.endpoint.protocol == Protocol.WebSockets) && 
		!this.LogicClient.options.isConnectedToEndpoint
	}

	canEndStream(){
		return this.LogicClient.options.endpointRef.endpoint != null && 
		(this.LogicClient.options.endpointRef.endpoint.grpcMode == gRPCMode['Client Streaming'] || 
		this.LogicClient.options.endpointRef.endpoint.grpcMode == gRPCMode['Server Streaming'] || 
		this.LogicClient.options.endpointRef.endpoint.grpcMode == gRPCMode['Bidirectional Streaming'] ||
		this.LogicClient.options.endpointRef.endpoint.protocol == Protocol.WebSockets) && 
		this.LogicClient.options.isConnectedToEndpoint
	}

	async stream(){
		await sleep(700);
		if(!this.isAutomaticSending || !this.canSendData()) return true;
		await this.sendData();
		return await this.stream();
	}

	async sendData(){
		let request = new RequestData();
		request.header = { 
			protocol: this.LogicClient.options.protocol,
			endpoint: this.LogicClient.options.endpointRef
		};
		request.data = {
			data: this.LogicClient.options.data
		};
		request.origin = this.LogicClient.port.connections[0];
		request.originID = this.LogicClient.originID;
		if(this.LogicClient.options.connectedId != null) {
			request.requestId = this.LogicClient.options.connectedId;
			request.header.stream = true;
		}
		else{
			request.requestId = UUID();
		}
		let res = this.LogicClient.sendData(request);
		this.updateSelection();
		if(! (await res)){
			this.isAutomaticSending = false;
			this.canAutoSend = true;
		}
	}

	estabilishConnection(){
		if(this.LogicClient.options.isConnectedToEndpoint) return;
		this.LogicClient.options.isConnectedToEndpoint = true;
		
		let id = UUID();
		let request = new RequestData();
		request.header = { 
			protocol: this.LogicClient.options.protocol,
			endpoint: this.LogicClient.options.endpointRef,
			stream: true
		};
		request.data = {
			data: this.LogicClient.options.data
		};
		request.origin = this.LogicClient.port.connections[0];
		request.originID = this.LogicClient.originID;
		request.requestId = id;
		this.LogicClient.options.connectedId = id;
		this.LogicClient.sendData(request);

		this.updateSelection();
	}

	async endConnection(){
		if(!this.LogicClient.options.isConnectedToEndpoint) return;
		
		let id = this.LogicClient.options.connectedId;
		if(id == null) return;
		let request = new RequestData();
		request.header = { 
			protocol: this.LogicClient.options.protocol,
			endpoint: this.LogicClient.options.endpointRef,
			stream: false
		};
		request.data = {
			data: this.LogicClient.options.data
		};
		request.origin = this.LogicClient.port.connections[0];
		request.originID = this.LogicClient.originID;
		request.requestId = id;
		this.LogicClient.options.connectedId = null;
		this.canAutoSend = true;
		this.isAutomaticSending = false;
		await this.LogicClient.sendData(request);
		this.LogicClient.options.isConnectedToEndpoint = false;

		this.updateSelection();
	}
}
