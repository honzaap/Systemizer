import { Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
	selector: 'board-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
	
	@Output() onboardTutorial1 = new EventEmitter();

	constructor() { }

	ngOnInit(): void {
	}
}
