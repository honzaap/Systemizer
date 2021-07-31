import { Component } from '@angular/core';
import { ViewingService } from './viewing.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
  	title = 'Systemizer';
	constructor(private viewingService: ViewingService){
		if(viewingService.isDarkMode())
			document.documentElement.classList.add("dark-mode");
	}
}
