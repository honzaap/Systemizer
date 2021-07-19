import { Renderer2, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { Technology } from 'src/models/enums/Technology';
import { TextfieldComponent } from '../components/textfield/textfield.component';

@Component({
	selector: 'app-optionsmenu',
	templateUrl: './optionsmenu.component.html',
	styleUrls: ['./optionsmenu.component.scss'],
})
export class OptionsmenuComponent implements OnInit {

	isActive:boolean;

	openGeneral: boolean = true;
	openProps: boolean = true;
	openActions: boolean = true;

	hasActions: boolean = false;

	multipleSelectionsTitle: string = "Title";

	multipleSelectionsX: number;
	multipleSelectionsY: number;
	multipleSelectionsOldX: number;
	multipleSelectionsOldY: number;
	multipleSelectionsTechnology: Technology;

	@ViewChild("optionsWrapper") optionsWrapper;
	@ViewChild("actionsWrapper") actionsWrapper;

	public Technology: typeof Technology = Technology;
	public TechnologyKeys = Object.values(Technology).filter(k => !isNaN(Number(k)));

	sortedTechnologies = [];

	constructor(public selectionService: SelectionService, private renderer: Renderer2, private placingService: PlacingService) 
	{
		selectionService.onChangeSelection( ()=>{
			this.optionsWrapper.nativeElement.innerHTML = "";
			this.actionsWrapper.nativeElement.innerHTML = "";
			this.multipleSelectionsX = Number.MAX_VALUE;
			this.multipleSelectionsY = Number.MAX_VALUE;
			if(this.selectionService.currentSelections.length == 0){
				this.isActive = false;
			}
			else if(this.selectionService.currentSelections.length == 1){
				let selection = this.selectionService.currentSelections[0];
				this.optionsWrapper.nativeElement.innerHTML = "";
				this.actionsWrapper.nativeElement.innerHTML = "";
				this.isActive = true;

				let optionsElement = selection.getOptionsElement();
				if(optionsElement)
					this.renderer.appendChild(this.optionsWrapper.nativeElement,optionsElement.nativeElement);
				let actionsElement = selection.getActionsElement();

				if(actionsElement){
					this.hasActions = true;
					this.renderer.appendChild(this.actionsWrapper.nativeElement,actionsElement.nativeElement);
				}
				else
					this.hasActions = false;
			}
			else{
				this.isActive = true;
				this.multipleSelectionsTitle = this.selectionService.currentSelections[0].getLogicComponent().options.title;
				this.multipleSelectionsTechnology = this.selectionService.currentSelections[0].getLogicComponent().options.technology;
				let sameTitles = true;
				let sameTechs = true;
				for(let selection of this.selectionService.currentSelections){
					let options = selection.getLogicComponent().options;
					if(options.X < this.multipleSelectionsX)
						this.multipleSelectionsX = options.X;
					if(options.Y < this.multipleSelectionsY)
						this.multipleSelectionsY = options.Y;
					if(options.title != this.multipleSelectionsTitle){
						sameTitles = false;
					}
					if(options.technology != this.multipleSelectionsTechnology){
						sameTechs = false;
					}
				}
				this.multipleSelectionsOldX = this.multipleSelectionsX;
				this.multipleSelectionsOldY = this.multipleSelectionsY;
				if(!sameTitles)
					this.multipleSelectionsTitle = "Title";
				if(!sameTechs){
					this.multipleSelectionsTechnology = null;
				}
			}
		});
		this.sortedTechnologies = this.TechnologyKeys.map(key => Technology[key])
		.filter(key => key !== "None").sort(function (a, b) {
			return a.toLowerCase().localeCompare(b.toLowerCase());
		}).map(key => Technology[key]);
	}

	isSelectionTextField(){
		return this.selectionService.currentSelections.length == 1 && this.selectionService.currentSelections[0] instanceof TextfieldComponent;
	}
	
	ngOnInit(): void {
	}

	handleTechChange(){
		if(this.selectionService.currentSelections[0].getLogicComponent().options.technology == 0){
			this.selectionService.currentSelections[0].getLogicComponent().options.technology = null;
		}
	}

	updateTitles(){
		for(let selection of this.selectionService.currentSelections){
			selection.getLogicComponent().options.title = this.multipleSelectionsTitle;
		}
	}

	updatePosition(x, y){
		if(this.selectionService.currentSelections.length == 1){
			x = parseInt(x);
			y = parseInt(y);
			if(x < 0 || x > this.placingService.boardWidth - 40 || y < 0 || y > this.placingService.boardHeight - 40){
				for(let selection of this.selectionService.currentSelections){
					selection.setPosition(x,y);
				}
			}
		}
		else {
			let realX = Math.max(Math.min(this.multipleSelectionsX, this.placingService.boardWidth - 40), 0);
			let realY = Math.max(Math.min(this.multipleSelectionsY, this.placingService.boardHeight - 40), 0);
			for(let selection of this.selectionService.currentSelections){
				selection.setPosition(
					selection.getLogicComponent().options.X + realX - this.multipleSelectionsOldX, 
					selection.getLogicComponent().options.Y + realY - this.multipleSelectionsOldY
				); 
			}
			
			this.multipleSelectionsOldX = realX;
			this.multipleSelectionsOldY = realY;
		}
	}

	updateTechs(){
		if(this.multipleSelectionsTechnology == 0){
			for(let selection of this.selectionService.currentSelections){
				selection.getLogicComponent().options.technology = null;
			}
		}
		else{
			for(let selection of this.selectionService.currentSelections){
				selection.getLogicComponent().options.technology = this.multipleSelectionsTechnology;
			}
		}
		
	}
}
