import { Renderer2, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { SelectionService } from 'src/app/selection.service';
import { MessagequeueComponent } from '../components/messagequeue/messagequeue.component';
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

	@ViewChild("optionsWrapper") optionsWrapper;
	@ViewChild("actionsWrapper") actionsWrapper;

	constructor(public selectionService: SelectionService, private renderer: Renderer2) 
	{
		selectionService.onChangeSelection( ()=>{
			let selection = this.selectionService.currentSelection;
			this.optionsWrapper.nativeElement.innerHTML = "";
			this.actionsWrapper.nativeElement.innerHTML = "";
			if(selection != null){
				this.isActive = true;
				this.optionsWrapper.nativeElement.innerHTML = "";

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
			else
				this.isActive = false;
		});
	}

	isSelectionTextField(){
		return this.selectionService.currentSelection.constructor.name == TextfieldComponent.name;
	}
	
	isSelectionMQ(){
		return this.selectionService.currentSelection.constructor.name == MessagequeueComponent.name;
	}

	change(e:Event, x, y){
		x = parseInt(x);
		y = parseInt(y);
		if(x < 0 || x > 1960 || y < 0 || y > 960)
			this.selectionService.currentSelection.setPosition(x,y);
	}

	ngOnInit(): void {
	}
}
