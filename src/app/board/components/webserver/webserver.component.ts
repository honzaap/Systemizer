import { ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { RequestData } from 'src/models/RequestData';
import { WebServer } from 'src/models/WebServer';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
  selector: 'webserver',
  queries: {
	anchorRef: new ViewChild( "anchorRef" ),
	optionsRef: new ViewChild( "options" ),
    inputPortRef: new ViewChild("inputPort"),
	outputPortRef: new ViewChild("outputPort")
  },
  templateUrl: './webserver.component.html',
  styleUrls: ['./webserver.component.scss']
})
export class WebserverComponent extends OperatorComponent implements OnInit {

  // Logic
	public LogicWebServer : WebServer = new WebServer();
	data : RequestData;

	constructor(placingService: PlacingService, selectionService: SelectionService) 
	{
		super(placingService, selectionService);
		this.LogicWebServer.onReceiveData((data) => {
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
		this.LogicWebServer.destroy();
		this.destroyComponent();
	}

	
	sendData(){
		//let data = new RequestData();
		//this.LogicWebServer.sendData(data);
	}

	public getLogicComponent(){
		return this.LogicWebServer;
	}
}
