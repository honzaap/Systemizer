import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ExportPngOptions, ExportSvgOptions } from 'src/app/export.service';
import { PlacingService } from 'src/app/placing.service';
import { SavingService } from 'src/app/saving.service';
import { ViewingService } from 'src/app/viewing.service';

@Component({
	selector: 'board-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
	
	// File section events
	@Output() newFile = new EventEmitter();
	@Output() saveFile = new EventEmitter();
	@Output() loadFile = new EventEmitter();
	@Output() save = new EventEmitter();
	@Output() exportPng = new EventEmitter();
	@Output() exportSvg = new EventEmitter();

	// Edit section events
	@Output() copy = new EventEmitter();
	@Output() paste = new EventEmitter();
	@Output() cut = new EventEmitter();
	@Output() del = new EventEmitter();
	@Output() undo = new EventEmitter();
	@Output() redo = new EventEmitter();
	@Output() clearBoard = new EventEmitter();

	// View section events
	@Output() fullscreen = new EventEmitter();
	@Output() zoomIn = new EventEmitter();
	@Output() zoomOut = new EventEmitter();

	// Help section events
	@Output() onboardTutorial1 = new EventEmitter();

	name = "Untitled System";
	confirmDialogOpen = false;
	confirmDialogText = "";
	isKeyboardShortcutsOpen = false;
	isExportPngDialogOpen = false;
	isExportSvgDialogOpen = false;
	isHelpersDisabled: boolean;
	isTitlesHidden: boolean;
	exportPngOptions: ExportPngOptions = new ExportPngOptions();
	exportSvgOptions: ExportSvgOptions = new ExportSvgOptions();
	confirmDialogReturnFunction = () => {};

	@ViewChild("file") fileInput;

	constructor(private placingService: PlacingService, private savingService: SavingService, private viewingService: ViewingService) { 
		this.isHelpersDisabled = viewingService.isHelpersDisabled();
		this.isTitlesHidden = viewingService.isTitlesHidden();
	}

	load(file){
		if(file.files.length == 0)
			return;
		if(!this.isJson(file.files[0].name)){
			this.placingService.showSnack("You need to upload .json file");
			return;
		}
		let reader = new FileReader();
	    reader.onload = ((f) => {
			return (e)=> { 
				let data = e.target.result; 
				this.loadFile.emit(data);
			}; 
		})(file);
		reader.readAsText(file.files[0]);
		this.fileInput.nativeElement.value = null;
	}

	private isJson(name: string){
		if(name.length == 0)
			return false;
		return name.substring(name.length - 5, name.length).toLowerCase() === ".json";
	}

	onNameChange(){
		this.savingService.systemName = this.name;
	}

	changeName(name){
		this.name = name;
		this.savingService.systemName = name;
	}

	ngOnInit(): void {
	}

	showConfirmDialog(text: string, returnFunction){
		this.confirmDialogOpen = true;
		this.confirmDialogText = text;
		this.confirmDialogReturnFunction = returnFunction;
	}

	closeDialog(){
		this.confirmDialogOpen = false;
	}

	confirmDialog(){
		this.confirmDialogReturnFunction();
		this.confirmDialogOpen = false;
	}

	newFileDialog(){
		this.newFile.emit();
	}

	clearBoardDialog(){
		this.clearBoard.emit();
	}

	exportAsPng(){
		this.exportPng.emit(this.exportPngOptions);
		this.closeExportPngDialog();
	}

	openExportPngDialog(){
		this.isExportPngDialogOpen = true;
	}

	closeExportPngDialog(){
		this.isExportPngDialogOpen = false;
	}

	exportAsSvg(){
		this.exportSvg.emit(this.exportSvgOptions);
		this.closeExportSvgDialog();
	}

	openExportSvgDialog(){
		this.isExportSvgDialogOpen = true;
	}

	closeExportSvgDialog(){
		this.isExportSvgDialogOpen = false;
	}

	openKeyboardShortcuts(){
		this.isKeyboardShortcutsOpen = true;
	}

	closeKeyboardShortcuts(){
		this.isKeyboardShortcutsOpen = false;
	}

	toggleHelpersDisabled(){
		this.isHelpersDisabled = !this.isHelpersDisabled;
		this.viewingService.setHelpersDisabled(this.isHelpersDisabled);
	}

	toggleTitlesHidden(){
		this.isTitlesHidden = !this.isTitlesHidden;
		this.viewingService.setTitlesHidden(this.isTitlesHidden);
	}
}
