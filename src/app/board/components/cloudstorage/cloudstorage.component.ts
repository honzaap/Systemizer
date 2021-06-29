import { Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ChangesService } from 'src/app/changes.service';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { CloudStorage } from 'src/models/CloudStorage';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'cloudstorage',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
	},
	templateUrl: './cloudstorage.component.html',
	styleUrls: ['./cloudstorage.component.scss']
})
export class CloudStorageComponent extends OperatorComponent implements OnInit {

	public LogicCloudStorage : CloudStorage = new CloudStorage();
	@ViewChild("conn", { read: ViewContainerRef }) conn;

	constructor(placingService: PlacingService, selectionService: SelectionService ,resolver: ComponentFactoryResolver, changesService: ChangesService){
		super(placingService, selectionService, resolver, changesService);
	}

	ngAfterViewInit(): void {
		super.Init(this.conn);
	}

	ngOnInit(){}

	getActionsElement(){
		return null;
	}

	public getLogicComponent(){
		return this.LogicCloudStorage;
	}
}
