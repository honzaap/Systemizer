import { ComponentFactoryResolver, ViewChild, ViewContainerRef } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Endpoint } from 'src/models/Endpoint';
import { HTTPMethod } from 'src/models/enums/HTTPMethod';
import { PubSub } from 'src/models/PubSub';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'app-pubsub',
	templateUrl: './pubsub.component.html',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		inputPortRef: new ViewChild("inputPort"),
		outputPortRef: new ViewChild("outputPort")
	},
  	styleUrls: ['./pubsub.component.scss']
})
export class PubsubComponent extends OperatorComponent implements OnInit {

	public LogicPubSub : PubSub = new PubSub();

	@ViewChild("conn", { read: ViewContainerRef }) conn;

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver){
		super(placingService, selectionService, resolver);
  	}

	ngAfterViewInit(): void {
		super.Init(this.conn);
  	}

	ngOnInit(){}

	addEndpoint(){
		this.LogicPubSub.options.endpoints.push(new Endpoint("topic.topicCreated", [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.PATCH, HTTPMethod.DELETE]));
	}

	removeEndpoint(endpoint: Endpoint){
		let idx = 0;
		for(let ep of this.LogicPubSub.options.endpoints){
			if(ep === endpoint){
				this.LogicPubSub.options.endpoints.splice(idx,1);
				return;
			} 
			idx++;
		}	
	}
	
	handleEndpointUrlChange(endpoint){
		if(endpoint.url == null || endpoint.url.replace(/\s/g,"") == "")
			endpoint.url = `topic`;
	}

	getActionsElement(){
		return null;
	}

	public getLogicComponent(){
		return this.LogicPubSub;
	}
}