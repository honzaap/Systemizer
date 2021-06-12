import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
	selector: 'app-create',
	templateUrl: './create.component.html',
	styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {
	@Input() queryParams?: Params | null

	isTutorialMenuOpen = false;
	showOnboardIntro = false;
	showMobileDisclaimer = false;

  	constructor(private route: ActivatedRoute) { }

	ngOnInit(): void {
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
			this.showMobileDisclaimer = true;
		}
		else{
			let seenIntroTutorial = localStorage.getItem("seenIntroTutorial");
			this.route.queryParams
				.subscribe(params => {
					this.showOnboardIntro = params["showOnboardTutorial"] == "true";
				}
			  );
			if(seenIntroTutorial != "true" || this.showOnboardIntro){
				this.openTutorialMenu();
				localStorage.setItem("seenIntroTutorial", "true");
			}
		}
	}

	closeTutorialMenu(){
		this.isTutorialMenuOpen = false;
	}

	openTutorialMenu(){
		this.isTutorialMenuOpen = true;
	}

}
