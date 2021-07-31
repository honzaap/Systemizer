import { Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { ClientCluster } from 'src/models/ClientCluster';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'app-clientcluster',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		actionsRef: new ViewChild("actions")
	},
	templateUrl: './clientcluster.component.html',
	styleUrls: ['./clientcluster.component.scss']
})
export class ClientclusterComponent extends OperatorComponent implements OnInit {

	LogicClientCluster: ClientCluster = new ClientCluster();

	@ViewChild("conn", { read: ViewContainerRef }) conn;

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver){
		super(placingService, selectionService, resolver);
	}
	ngOnInit(): void {
	}

	ngAfterViewInit(): void {
		super.Init(this.conn);
  	}

	public getLogicComponent(){
		return this.LogicClientCluster;
	}

	static getColor(): string{
		let c = new ClientCluster();
		return c.color;
	}
}
