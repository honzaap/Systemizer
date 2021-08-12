import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Proxy } from 'src/models/Proxy';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'app-proxy',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
	},
	templateUrl: './proxy.component.html',
	styleUrls: ['./proxy.component.scss']
})
export class ProxyComponent extends OperatorComponent implements OnInit {

	public LogicProxy: Proxy = new Proxy();
	@ViewChild("conn", { read: ViewContainerRef }) conn;

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver, cdRef: ChangeDetectorRef) { 
		super(placingService, selectionService, resolver, cdRef)
		
	}

	ngOnInit(): void {
		this.cdRef.detectChanges();
	}
	
	ngAfterViewInit(): void {
		super.Init(this.conn);
	}

	getLogicComponent(){
		return this.LogicProxy;
	}

	static getColor(): string{
		let c = new Proxy();
		return c.color;
	}
}