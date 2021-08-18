import { Component, OnInit } from '@angular/core';
import { BalancingAlgorithm } from 'src/models/enums/BalancingAlgorithm';
import { LoadBalancerType } from 'src/models/enums/LoadBalancerType';
import { LoadBalancer } from 'src/models/LoadBalancer';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
  	selector: 'loadbalancer',
	templateUrl: './loadbalancer.component.html',
  	styleUrls: ['./loadbalancer.component.scss']
})
export class LoadbalancerComponent extends OperatorComponent implements OnInit {

	public LogicLoadBalancer : LoadBalancer = new LoadBalancer();
	
	handleTypeChange(){
		if(this.LogicLoadBalancer.options.type == LoadBalancerType['Layer 4'] && 
		this.LogicLoadBalancer.options.algorithm == BalancingAlgorithm['URL Hash']){
			this.LogicLoadBalancer.options.algorithm = BalancingAlgorithm['Round Robin'];
		}
	}

	public getLogicComponent(){
		return this.LogicLoadBalancer;
	}

	static getColor(): string{
		let c = new LoadBalancer();
		return c.color;
	}
}
