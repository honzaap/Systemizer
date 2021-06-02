import { ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { MessageQueue } from 'src/models/MessageQueue';
import { RequestData } from 'src/models/RequestData';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
  selector: 'app-messagequeue',
  templateUrl: './messagequeue.component.html',
  queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		inputPortRef: new ViewChild("inputPort"),
		outputPortRef: new ViewChild("outputPort")
	},
  styleUrls: ['./messagequeue.component.scss']
})
export class MessagequeueComponent extends OperatorComponent implements OnInit {


  // Logic
	public LogicMessageQueue : MessageQueue = new MessageQueue();
	data : RequestData;

	constructor(placingService: PlacingService, selectionService: SelectionService) 
	{
		super(placingService, selectionService);
    	this.LogicMessageQueue.onReceiveData((data) => {
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

	getActionsElement(){
		return null;
	}

	destroySelf = () => {
		super.destroySelf();
		this.LogicMessageQueue.destroy();
		this.destroyComponent();
	}

	public getLogicComponent(){
		return this.LogicMessageQueue;
	}
}
