import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { APIGateway } from 'src/models/APIGateway';
import { Endpoint } from 'src/models/Endpoint';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'apigateway',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
	},
	templateUrl: './apigateway.component.html',
	styleUrls: ['./apigateway.component.scss']
})
export class ApiGatewayComponent  extends OperatorComponent implements OnInit{

	public LogicApiGateway : APIGateway = new APIGateway();
	@ViewChild("conn", { read: ViewContainerRef }) conn;

	connectableEndpoints: Endpoint[];

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver, cdRef: ChangeDetectorRef){
		super(placingService, selectionService, resolver, cdRef);
	}

	public handleClick(event: MouseEvent){
		super.handleClick(event);
		this.updateSelection();
	}

	updateSelection(){
		this.connectableEndpoints = this.LogicApiGateway.getConnectableEndpoints();
		let endpoints = this.LogicApiGateway.getEndpoints();
		for(let j = 0; j < endpoints.length; j++){
			let endpoint = endpoints[j]
			for(let i = 0; i < endpoint.actions.length; i++){
				let action = endpoint.actions[i];
				let currEdp = action.endpoint;
				let currMth = action.method;
				endpoints[j].actions[i].endpoint = null;
				if(this.connectableEndpoints.length == 0){
					this.connectableEndpoints = [];
					endpoint.actions = [];
					return;
				}
				if(currEdp != null && currMth != null){
					for(let e of this.connectableEndpoints){ // need this workaround to keep values in material select....
						if(e.url == currEdp.url)
							endpoints[j].actions[i].endpoint = e;
					}
					endpoint.actions[i].method = currMth;
				}
				else
					endpoint.actions.splice(i,1);
			}
		}
	}

	ngAfterViewInit(): void {
		super.Init(this.conn);
  	}

	public getLogicComponent(){
		return this.LogicApiGateway;
	}

	getActionsElement(){
		return null;
	}

	ngOnInit(){
		this.cdRef.detectChanges();
	}

	static getColor(): string{
		let c = new APIGateway();
		return c.color;
	}
}