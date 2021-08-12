import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Cache } from "src/models/Cache";
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
    selector: 'cache',
    queries: {
        anchorRef: new ViewChild( "anchorRef" ),
        optionsRef: new ViewChild( "options" ),
        actionsRef: new ViewChild("actions"),
    },
    templateUrl: './cache.component.html',
    styleUrls: ['./cache.component.scss']
})
export class CacheComponent extends OperatorComponent implements OnInit {
    
    public LogicCache : Cache = new Cache();

	@ViewChild("conn", { read: ViewContainerRef }) conn;

    constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver, cdRef: ChangeDetectorRef){
        super(placingService, selectionService, resolver, cdRef);
    }

    ngAfterViewInit(): void {
        super.Init(this.conn);
        this.getPortComponent()
    }

    ngOnInit(){
        this.cdRef.detectChanges();
    }

    getActionsElement(){
        return this.actionsRef;
    }

    public getLogicComponent(){
        return this.LogicCache;
    }

    static getColor(): string{
		let c = new Cache();
		return c.color;
	}
}
