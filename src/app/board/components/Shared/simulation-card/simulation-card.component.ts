import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { SimulationService } from 'src/app/simulation.service';
import { IDataOperator } from 'src/interfaces/IDataOperator';

@Component({
	selector: 'simulation-card',
	templateUrl: './simulation-card.component.html',
	styleUrls: ['./simulation-card.component.scss']
})
export class SimulationCardComponent implements OnInit {

	@Input() Model: IDataOperator;

	constructor(private cdRef: ChangeDetectorRef, public simulationService: SimulationService) { }

	ngOnInit(): void {
	}

	showCard(){
		this.simulationService.openSimulationCard(this.Model);
		this.cdRef.detectChanges();
	}

	closeCard(){
		this.simulationService.closeSimulationCard();
		this.cdRef.detectChanges();
	}
}
