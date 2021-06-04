import { ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Endpoint, MQEndpoint } from 'src/models/Endpoint';
import { PubSub } from 'src/models/PubSub';
import { RequestData } from 'src/models/RequestData';
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

  // Logic
	public LogicPubSub : PubSub = new PubSub();
	data : RequestData;

	constructor(placingService: PlacingService, selectionService: SelectionService) 
	{
		super(placingService, selectionService);
    	this.LogicPubSub.onReceiveData((data) => {
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

  addEndpoint(){
		this.LogicPubSub.options.endpoints.push(new MQEndpoint("topic.topicCreated"));
	}

  removeEndpoint(endpoint: Endpoint){
		let idx = 0;
		for(let ep of this.LogicPubSub.options.endpoints){
			if(ep === endpoint)
      {
        this.LogicPubSub.options.endpoints.splice(idx,1);
        return;
      } 
			idx++;
		}	
	}
  
	handleEndpointUrlChange(endpoint){
		if(endpoint.url == null || endpoint.url.replace(/\s/g,"") == ""){
			endpoint.url = `topic`
		}
	}

	getActionsElement(){
		return null;
	}

	destroySelf = () => {
		super.destroySelf();
		this.LogicPubSub.destroy();
		this.destroyComponent();
	}

	public getLogicComponent(){
		return this.LogicPubSub;
	}
}
