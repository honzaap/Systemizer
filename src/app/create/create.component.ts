import { ViewChild } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { download, downloadPng, downloadSvg } from 'src/shared/ExtensionMethods';
import { BoardComponent } from '../board/board.component';
import { PlacingService } from '../placing.service';
import { EmbedIFrameOptions, ExportPngOptions, ExportSvgOptions } from '../export.service';
import { BoardUIComponent } from '../board/boardUI/boardUI.component';
import { SavingService } from '../saving.service';
import { ViewingService } from '../viewing.service';

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
	showReadOnlyViewer = false;
	showReadOnlyViewerError = false;
	showBoard = true;
	showEdit = false;

	viewerSave: any;
	viewerEditLink: string;

	@ViewChild(BoardComponent) board:BoardComponent;
	@ViewChild(BoardUIComponent) ui:BoardUIComponent;

  	constructor(private route: ActivatedRoute, private placingService: PlacingService, private savingService: SavingService, private viewingService: ViewingService) { }

	ngOnInit(): void {
		let seenIntroTutorial = localStorage.getItem("seenIntroTutorial");
		this.route.queryParams
			.subscribe(params => {
				if(params.viewer){
					this.showBoard = false;
					try{
						this.viewerEditLink = `https://honzaap.github.io/Systemizer/create?edit=${params.viewer}`;
						let json = atob(params.viewer);
						let save = JSON.parse(json);
						if(Array.isArray(save)){
							this.viewerSave = this.savingService.getSaveFromOptimizedSave(save);
						}
						else{
							this.viewingService.setDarkMode(save.darkMode, false);
							this.viewingService.setTitlesHidden(!save.showTitles, false);
							this.viewerSave = this.savingService.getSaveFromOptimizedSave(save.comp);
						}
						this.showReadOnlyViewer = true;
					}
					catch{
						this.showReadOnlyViewerError = true;
					}
				}
				if(params.edit){
					try{
						let json = atob(params.edit);
						this.viewerSave = this.savingService.getSaveFromOptimizedSave(JSON.parse(json));
						this.showReadOnlyViewer = false;
						this.showEdit = true;
					}
					catch{
						this.showReadOnlyViewerError = true;
					}
				}
				this.showOnboardIntro = params["showOnboardTutorial"] == "true";
			}
		);

		if(seenIntroTutorial != "true" || this.showOnboardIntro){
			this.openTutorialMenu();
			localStorage.setItem("seenIntroTutorial", "true");
		}
	}

	getComponents(){
		return () => {
			return this.board.allLogicComponents;
		};
	}

	newFile(){
		this.board.newFile();
	}

	saveFile(name: string){
		if(this.board.allLogicComponents.length == 0){
			this.placingService.showSnack("There is nothing to save...");
			return;
		}
		let file = this.savingService.getBoardJson(this.board.allLogicComponents, name, this.board.currentBoardId);
		this.save();
		download(`${name}.json`, file);	
	}

	loadFile(json: string){
		// Pass the file to board component
		this.board.loadFromJson(json);
	}

	showSaved(){
		this.board.openSavedBoards();
	}

	save(){
		this.board.save(true);
	}

	async exportPng(options: ExportPngOptions){
		let canvas = await this.board.getCurrentBoardCanvas(options);
		if(canvas == null){
			this.placingService.showSnack("You can't export an empty board.");
			return;
		}
		downloadPng(this.ui.name+".png", canvas.toDataURL('image/png', 1));
	}

	async exportSvg(options: ExportSvgOptions){
		let svg = await this.board.getCurrentBoardSvg(options);
		if(svg == null){
			this.placingService.showSnack("You can't export an empty board.");
			return;
		}
		downloadSvg(this.ui.name+".svg", svg);
	}

	copy(){
		this.board.copyItem();
	}

	paste(){
		this.board.pasteItem();
	}

	selectAll(){
		this.board.selectAll();
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
		this.board.clearBoard(false);
		this.board.componentChanged();
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

	resetView(){
		this.board.resetView();
	}

	openTutorialMenu(){
		this.isTutorialMenuOpen = true;
	}

	closeTutorialMenu(){
		this.isTutorialMenuOpen = false;
	}

	changeSystemName(name: string){
		if(this.ui == null){
			setTimeout(() => {this.changeSystemName(name)}, 50);
		}
		else{
			this.ui.changeName(name);
		}
	}

	handleScaleChange(scale: number){
		this.placingService.boardScale = scale;
		this.board.updateBoardTransform();
	}
}
