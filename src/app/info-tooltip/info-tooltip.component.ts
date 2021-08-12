import { Component, Input, OnInit } from '@angular/core';
import { ViewingService } from '../viewing.service';

@Component({
	selector: 'info-tooltip',
	templateUrl: './info-tooltip.component.html',
	styleUrls: ['./info-tooltip.component.scss']
})
export class InfoTooltipComponent implements OnInit {

	@Input() Message : string;

  	constructor(public viewingService: ViewingService) { }

	ngOnInit(): void { }
}
