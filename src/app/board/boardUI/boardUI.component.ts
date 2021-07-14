import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ExportPngOptions, ExportService, ExportSvgOptions } from 'src/app/export.service';
import { PlacingService } from 'src/app/placing.service';
import { SavingService } from 'src/app/saving.service';
import { ViewingService } from 'src/app/viewing.service';
import { IDataOperator } from 'src/interfaces/IDataOperator';
import { downloadPng, downloadSvg } from 'src/shared/ExtensionMethods';

@Component({
	selector: 'board-ui',
	templateUrl: './boardUI.component.html',
	styleUrls: ['./boardUI.component.scss']
})
export class BoardUIComponent implements OnInit {
	
	// File section events
	@Output() newFile = new EventEmitter();
	@Output() saveFile = new EventEmitter<string>();
	@Output() loadFile = new EventEmitter();
	@Output() showSaved = new EventEmitter();
	@Output() save = new EventEmitter();
	@Output() exportPng = new EventEmitter();
	@Output() exportSvg = new EventEmitter();

	// Edit section events
	@Output() copyComponent = new EventEmitter();
	@Output() pasteComponent = new EventEmitter();
	@Output() cutComponent = new EventEmitter();
	@Output() delComponent = new EventEmitter();
	@Output() undo = new EventEmitter();
	@Output() redo = new EventEmitter();
	@Output() clearBoard = new EventEmitter();

	// View section events
	@Output() fullscreen = new EventEmitter();
	@Output() zoomIn = new EventEmitter();
	@Output() zoomOut = new EventEmitter();
	@Output() changeScale = new EventEmitter<number>();
	@Output() resetView = new EventEmitter();

	// Help section events
	@Output() onboardTutorial1 = new EventEmitter();

	@Input() getComponents: () => IDataOperator[];

	name = "Untitled System";
	saveFileName = "Untitled System";

	confirmDialogText = "";
	confirmDialogOpen: boolean = false;

	isKeyboardShortcutsOpen: boolean = false;
	isExportPngDialogOpen: boolean = false;
	isExportSvgDialogOpen: boolean = false;

	isHelpersDisabled: boolean = false;
	isTitlesHidden: boolean = false;
	isPreviewOpen: boolean = false;
	isSavingOpen: boolean = false;

	canUseShortcuts: boolean = true;

	exportPngOptions: ExportPngOptions = new ExportPngOptions();
	exportSvgOptions: ExportSvgOptions = new ExportSvgOptions();
	exportPngPreview: HTMLCanvasElement;
	exportSvgPreview: SVGElement;

	scaleControl: FormControl = new FormControl();
	scaleSelectList = [0.1, 0.5, 1, 1.5, 2];

	confirmDialogReturnFunction = () => {};

	@ViewChild("file") fileInput;
	@ViewChild("preview") preview;

	/**
	 * Dictionary of keys witht assigned function when pressed with ctrl key
	 */
	controlShortcuts = { 
		"c": (e: Event) => {
			this.copyComponent.emit();
		},
		"v": (e: Event) => {
			this.pasteComponent.emit();
		},
		"x": (e: Event) => {
			this.cutComponent.emit();
		},
		"s": (e: Event) => {
			e.preventDefault();
			this.save.emit(true);
		},
		"z": (e: Event) => {
			e.preventDefault();
			this.undo.emit();
		},
		"y": (e: Event) => {
			e.preventDefault();
			this.redo.emit();
		},
		"+": (e: Event) => {
			e.preventDefault();
			this.zoomIn.emit();
		},
		"-": (e: Event) => {
			e.preventDefault();
			this.zoomOut.emit();
		}
	}

	constructor(private placingService: PlacingService, private savingService: SavingService, private viewingService: ViewingService, private exportService: ExportService) { 
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
		this.saveFileName = name;
		this.savingService.systemName = name;
	}

	ngOnInit(): void {
		this.scaleControl.setValue(1);
		document.addEventListener("focusin", () => {
			this.canUseShortcuts = false;
		}); 
		document.addEventListener("focusout", () => {
			this.canUseShortcuts = true;
		});
		window.onkeydown = (e: KeyboardEvent)=>{
			if(!this.canUseShortcuts)
				return;
			if(e.ctrlKey && this.controlShortcuts[e.key]){
				this.controlShortcuts[e.key](e);
			}
			if(e.key === 'Delete')
				this.delComponent.emit();
		}
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

	openSaveFile(){
		this.isSavingOpen = true;
		this.saveFileName = this.name;
	}

	clearBoardDialog(){
		this.clearBoard.emit();
	}

	async exportAsPng(){
		let components = this.getComponents()
		if(components == null || components.length == 0){
			this.placingService.showSnack("You can't export an empty board.");
			return;
		}
		let canvas = await this.exportService.getCanvas(components, this.exportPngOptions);
		downloadPng(this.name+".png", canvas.toDataURL('image/png', 1));
		this.closeExportPngDialog();
	}

	async openExportPngDialog(){
		this.isExportPngDialogOpen = true;
	}

	closeExportPngDialog(){
		this.isExportPngDialogOpen = false;
	}

	async exportAsSvg(){
		let svg = await this.exportService.getSvg(this.getComponents(), this.exportSvgOptions);
		if(svg == null){
			this.placingService.showSnack("You can't export an empty board.");
			return;
		}
		downloadSvg(this.name+".svg", svg);
		this.closeExportSvgDialog();
	}

	async openExportSvgDialog(){
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
	
	async openPreview(png: boolean = true){
		if(png){
			this.exportPngPreview = await this.exportService.getCanvas(this.getComponents(), this.exportPngOptions);
			this.exportPngPreview.style.width = "100%";
			this.exportPngPreview.style.marginBottom = "-5px";
			this.preview.nativeElement.innerHTML = "";
			this.preview.nativeElement.appendChild(this.exportPngPreview);
		}
		else{
			let components = this.getComponents();
			this.exportSvgPreview = await this.exportService.getSvg(components, this.exportSvgOptions);
			this.exportSvgPreview.style.marginBottom = "-5px";
			this.preview.nativeElement.innerHTML = "";
			this.preview.nativeElement.appendChild(this.exportSvgPreview);
		}
		this.isPreviewOpen = true;
	}

	closePreview(){
		this.isPreviewOpen = false;
	}

	handleScaleChange(){
		this.changeScale.emit(this.scaleControl.value);
	}
}
