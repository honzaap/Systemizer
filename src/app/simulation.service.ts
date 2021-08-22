import { Injectable } from '@angular/core';
import { IDataOperator } from 'src/interfaces/IDataOperator';

@Injectable({
  	providedIn: 'root'
})
export class SimulationService {

	public isFlowSimulationOn: boolean = false;
	public isSimulationCardOpen: boolean = false;
	public Model: IDataOperator;

	constructor() { }

	startFlowSimulation(){
		this.isFlowSimulationOn = true;
	}

	stopFlowSimulation(){
		this.isFlowSimulationOn = false;
	}

	closeSimulationCard(){
		this.isSimulationCardOpen = false;
		this.Model = null;
	}

	openSimulationCard(model: IDataOperator){
		this.Model = model;
		this.isSimulationCardOpen = true;
	}
}
