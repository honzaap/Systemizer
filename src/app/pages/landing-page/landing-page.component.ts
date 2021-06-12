import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'landing-page',
	templateUrl: './landing-page.component.html',
	styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {

	constructor() { }

	ngOnInit(): void {
		document.getElementsByClassName("page")[0].scrollTop = 0;
	}

}
