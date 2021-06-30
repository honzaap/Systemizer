import { ViewChild } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { downloadPng } from 'src/shared/ExtensionMethods';
import { BoardComponent } from '../board/board.component';
import { HeaderComponent } from '../board/header/header.component';
import { PlacingService } from '../placing.service';
import { ExportPngOptions } from '../saving.service';

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

  	constructor(private route: ActivatedRoute, private placingService: PlacingService) { }

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

	newFile(){
		this.board.newFile();
	}

	saveFile(name: string){
		this.board.saveFile(name);
	}

	loadFile(json: string){
		// Pass the file to board component
		this.board.loadFromJson(json);
	}

	save(){
		this.board.save(true);
	}

	async exportPng(options: ExportPngOptions){
		let canvas = await this.board.getBoardCanvas(options);
		if(canvas == null){
			this.placingService.showSnack("You can't export an empty board.");
			return;
		}
		downloadPng(this.header.name+".png", canvas.toDataURL('image/png', 1));
	}

	copy(){
		this.board.copyItem();
	}

	paste(){
		this.board.pasteItem();
	}

	cut(){
		this.board.cutItem();
	}

	deleteComponent(){
		this.board.delete();
	}

	undo(){
		this.board.undo();
	}

	redo(){
		this.board.redo();
	}

	clearBoard(){
		this.board.clearBoard(true);
	}

	fullscreen(){
		document.body.requestFullscreen();
	}

	zoomIn(){
		this.board.zoomIn();
	}

	zoomOut(){
		this.board.zoomOut();
	}

	openTutorialMenu(){
		this.isTutorialMenuOpen = true;
	}

	closeTutorialMenu(){
		this.isTutorialMenuOpen = false;
	}

	changeSystemName(name: string){
		if(this.header == null){
			setTimeout(() => {this.changeSystemName(name)}, 50);
		}
		else{
			this.header.changeName(name);
		}
	}
}
