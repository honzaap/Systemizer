import { ComponentFactoryResolver, ViewChild, ViewContainerRef } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { OperatorComponent } from '../Shared/OperatorComponent';
import { Cache } from "src/models/Cache"

@Component({
    selector: 'cache',
    queries: {
        anchorRef: new ViewChild( "anchorRef" ),
        optionsRef: new ViewChild( "options" ),
        actionsRef: new ViewChild("actions"),
        inputPortRef: new ViewChild("inputPort"),
        outputPortRef: new ViewChild("outputPort")
    },
    templateUrl: './cache.component.html',
    styleUrls: ['./cache.component.scss']
})
export class CacheComponent extends OperatorComponent implements OnInit {
    
    public LogicCache : Cache = new Cache();

	@ViewChild("conn", { read: ViewContainerRef }) conn;

    constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver){
        super(placingService, selectionService, resolver);
    }

    ngAfterViewInit(): void {
        super.Init(this.conn);
        this.getPortComponent()
    }

    ngOnInit(){}

    getActionsElement(){
        return this.actionsRef;
    }

    public getLogicComponent(){
        return this.LogicCache;
    }
}
