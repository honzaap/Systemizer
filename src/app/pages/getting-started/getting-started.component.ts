import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'getting-started',
	templateUrl: './getting-started.component.html',
	styleUrls: ['./getting-started.component.scss']
})
export class GettingStartedComponent implements OnInit {

	constructor() { }

	ngOnInit(): void {
		document.getElementsByClassName("page")[0].scrollTop = 0;
	}

}
