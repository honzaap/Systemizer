import { Component, Input, OnInit } from '@angular/core';
import { IDataOperator } from 'src/interfaces/IDataOperator';

@Component({
	selector: 'slider-described',
	templateUrl: './slider-described.component.html',
	styleUrls: ['./slider-described.component.scss']
})
export class SliderDescribedComponent implements OnInit {

	constructor() { }

	@Input() Model: IDataOperator;
	@Input() Title: string = "Performance: ";
	@Input() Property: string = "performance";
	@Input() AfterChange;
	@Input() Tooltip: string = "Changes the throughput of the component."

	ngOnInit(): void {
	}
}
