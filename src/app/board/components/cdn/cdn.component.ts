import { Component, OnInit } from '@angular/core';
import { CDN } from 'src/models/CDN';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
	selector: 'cdn',
	templateUrl: './cdn.component.html',
	styleUrls: ['./cdn.component.scss']
})
export class CDNComponent extends OperatorComponent implements OnInit {

	public LogicCDN : CDN = new CDN();

	public getLogicComponent(){
		return this.LogicCDN;
	}

	static getColor(): string{
		let c = new CDN();
		return c.color;
	}
}