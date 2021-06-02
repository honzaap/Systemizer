import { ElementRef, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { TextField } from 'src/models/TextField';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
  selector: 'textfield',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
		actionsRef: new ViewChild("actions")
	},
  templateUrl: './textfield.component.html',
  styleUrls: ['./textfield.component.scss']
})
export class TextfieldComponent  extends OperatorComponent implements OnInit{

	// Logic
	public LogicTextField : TextField = new TextField();
  	private selService: SelectionService

  	@ViewChild("field") field: ElementRef;

	constructor(placingService: PlacingService, selectionService: SelectionService) {
		super(placingService, selectionService);
    	this.selService = selectionService;
	}

	ngAfterViewInit(): void {
		super.Init();
  	}

	ngOnInit(){
	}

	public handleClick(){
		super.handleClick();
	}

	public handleMousedown(event){
		if(this.selService.currentSelection !== this){
			super.handleMousedown(event);
		}
	}

	public getLogicComponent(){
		return this.LogicTextField;
	}

	destroySelf = () => {
		super.destroySelf();
		this.LogicTextField.destroy();
		this.destroyComponent();
	}

	toggleBold(){
		this.LogicTextField.options.isBold = !this.LogicTextField.options.isBold;
	}

	toggleItalic(){
		this.LogicTextField.options.isItalic = !this.LogicTextField.options.isItalic;
	}
}
