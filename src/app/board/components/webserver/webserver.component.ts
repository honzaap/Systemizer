import { Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
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

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver){
		super(placingService, selectionService, resolver);
  	}

	ngAfterViewInit(): void {
		super.Init(this.conn);
	}

	ngOnInit(){}

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