import { ViewChild } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { BoardComponent } from '../board/board.component';
import { HeaderComponent } from '../board/header/header.component';

@Component({
	selector: 'app-create',
	templateUrl: './create.component.html',
	styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
	@Input() queryParams?: Params | null

	isTutorialMenuOpen = false;
	showOnboardIntro = false;
	showMobileDisclaimer = false;
	@ViewChild(BoardComponent) board:BoardComponent;
	@ViewChild(HeaderComponent) header:HeaderComponent;

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
	
	saveFile(name: string){
		this.board.saveFile(name);
	}

	loadFile(json: string){
		// Pass the file to board component
		this.board.loadFromJson(json);
	}

	changeSystemName(name: string){
		this.header.name = name;
	}

}
