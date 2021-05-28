import { ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { BalancingAlgorithm } from 'src/models/enums/BalancingAlgorithm';
import { LoadBalancerType } from 'src/models/enums/LoadBalancerType';
import { LoadBalancer } from 'src/models/LoadBalancer';
import { RequestData } from 'src/models/RequestData';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
  selector: 'loadbalancer',
  templateUrl: './loadbalancer.component.html',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		inputPortRef: new ViewChild("inputPort"),
		outputPortRef: new ViewChild("outputPort")
	},
  styleUrls: ['./loadbalancer.component.scss']
})
export class LoadbalancerComponent extends OperatorComponent implements OnInit {


  // Logic
	public LogicLoadBalancer : LoadBalancer = new LoadBalancer();
	data : RequestData;

	constructor(placingService: PlacingService, selectionService: SelectionService) 
	{
		super(placingService, selectionService);
    	this.LogicLoadBalancer.onReceiveData((data) => {
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
		this.LogicLoadBalancer.destroy();
		this.destroyComponent();
	}

	handleTypeChange(){
		if(this.LogicLoadBalancer.options.type == LoadBalancerType['Layer 4'] && this.LogicLoadBalancer.options.algorithm == BalancingAlgorithm['URL Hash']){
			this.LogicLoadBalancer.options.algorithm = BalancingAlgorithm['Round Robin'];
		}
	}

	public getLogicComponent(){
		return this.LogicLoadBalancer;
	}
}
