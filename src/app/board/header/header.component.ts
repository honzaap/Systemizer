import { Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SavingService } from 'src/app/saving.service';

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

	// Edit section events
	@Output() copy = new EventEmitter();
	@Output() paste = new EventEmitter();
	@Output() cut = new EventEmitter();
	@Output() del = new EventEmitter();
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
	confirmDialogReturnFunction = () => {};

	constructor(private placingService: PlacingService, private savingService: SavingService) { }

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

}
