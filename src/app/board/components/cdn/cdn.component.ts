import { Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { CDN } from 'src/models/CDN';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'cdn',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
	},
	templateUrl: './cdn.component.html',
	styleUrls: ['./cdn.component.scss']
})
export class CDNComponent extends OperatorComponent implements OnInit {

	public LogicCDN : CDN = new CDN();
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
		return this.LogicCDN;
	}

	static getColor(): string{
		let c = new CDN();
		return c.color;
	}
}