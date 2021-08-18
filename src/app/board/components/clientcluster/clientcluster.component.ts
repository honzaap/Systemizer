import { Component, OnInit } from '@angular/core';
import { ClientCluster } from 'src/models/ClientCluster';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'app-clientcluster',
	templateUrl: './clientcluster.component.html',
	styleUrls: ['./clientcluster.component.scss']
})
export class ClientclusterComponent extends OperatorComponent implements OnInit {

	LogicClientCluster: ClientCluster = new ClientCluster();

	public getLogicComponent(){
		return this.LogicClientCluster;
	}

	static getColor(): string{
		let c = new ClientCluster();
		return c.color;
	}
}
